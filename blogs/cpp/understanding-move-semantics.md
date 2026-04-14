# Understanding Move Semantics in Modern C++

Move semantics is one of the most important features introduced in C++11. To truly understand it, you first need a solid grasp of **value categories** — specifically, the distinction between lvalues and rvalues.

## Value Categories: Lvalues vs Rvalues

Every expression in C++ belongs to a **value category**. The two fundamental ones are:

- **lvalue** — an expression that refers to a memory location and has a persistent identity. You can take its address with `&`.
- **rvalue** — a temporary value that does not persist beyond the expression. You cannot take its address.

```cpp
int x = 42;        // x is an lvalue (has identity, has a memory address)
int y = x + 1;     // (x + 1) is an rvalue (temporary, no persistent address)

int* p = &x;       // OK: x is an lvalue
// int* q = &(x+1); // ERROR: cannot take address of an rvalue
```

### Simple Rule of Thumb

If it has a **name** and you can take its **address**, it's an lvalue. If it's a **temporary** or a **literal**, it's an rvalue.

```cpp
std::string name = "Jatin";         // name is lvalue, "Jatin" is rvalue
std::string greeting = name + "!";  // (name + "!") is rvalue
```

### Lvalue References vs Rvalue References

C++ has always had lvalue references (`&`). C++11 added **rvalue references** (`&&`):

```cpp
int& ref = x;          // lvalue reference — binds to lvalues
// int& ref2 = 42;     // ERROR: lvalue ref cannot bind to rvalue

int&& rref = 42;       // rvalue reference — binds to rvalues
// int&& rref2 = x;    // ERROR: rvalue ref cannot bind to lvalue
```

A `const` lvalue reference can bind to both:

```cpp
const int& cref = x;   // OK: binds to lvalue
const int& cref2 = 42; // OK: binds to rvalue (lifetime extended)
```

This is why pre-C++11 functions took `const T&` to accept both lvalues and rvalues — but they couldn't distinguish between the two.

## The Problem: Expensive Copies

Before C++11, when you returned a large object from a function or passed it by value, the compiler would create copies:

```cpp
std::vector<int> createLargeVector() {
    std::vector<int> result;
    result.reserve(1000000);
    for (int i = 0; i < 1000000; ++i) {
        result.push_back(i);
    }
    return result;  // Copy? Expensive!
}
```

With a million integers, that copy involves allocating new memory, copying each element, and then deallocating the old memory. That's wasteful — the original `result` is about to be destroyed anyway.

## Move Constructor and Move Assignment

A class can define a **move constructor** and **move assignment operator** to handle resource transfer instead of copying:

```cpp
class Buffer {
private:
    int* data;
    size_t size;

public:
    // Regular constructor
    Buffer(size_t n) : data(new int[n]), size(n) {}

    // Copy constructor (expensive)
    Buffer(const Buffer& other) : data(new int[other.size]), size(other.size) {
        std::copy(other.data, other.data + size, data);
    }

    // Move constructor (cheap — just pointer swap)
    Buffer(Buffer&& other) noexcept
        : data(other.data), size(other.size) {
        other.data = nullptr;
        other.size = 0;
    }

    // Move assignment operator
    Buffer& operator=(Buffer&& other) noexcept {
        if (this != &other) {
            delete[] data;
            data = other.data;
            size = other.size;
            other.data = nullptr;
            other.size = 0;
        }
        return *this;
    }

    ~Buffer() { delete[] data; }
};
```

The move constructor simply **steals** the internal pointer rather than allocating and copying. The moved-from object is left in a valid but empty state.

### When Does the Compiler Choose Move vs Copy?

- **rvalue** argument → move constructor/assignment is called
- **lvalue** argument → copy constructor/assignment is called

```cpp
Buffer a(1000);
Buffer b = a;              // COPY: a is an lvalue
Buffer c = Buffer(1000);   // MOVE: Buffer(1000) is an rvalue (temporary)
```

## std::move: Converting Lvalue to Rvalue

Sometimes you want to move from a **named** object (an lvalue). Use `std::move` to cast it to an rvalue reference:

```cpp
std::string source = "Hello, World!";
std::string destination = std::move(source);
// source is now in a valid but unspecified state (likely empty)
// destination contains "Hello, World!"
```

**Critical point**: `std::move` does not move anything. It's just a cast — it converts an lvalue to an rvalue reference. The actual move happens when the resulting rvalue is consumed by a move constructor or move assignment operator.

Under the hood, `std::move` is essentially:

```cpp
template <typename T>
typename std::remove_reference<T>::type&& move(T&& arg) noexcept {
    return static_cast<typename std::remove_reference<T>::type&&>(arg);
}
```

### Common Use Cases

**Passing ownership to functions:**

```cpp
void storeData(std::vector<int> data);  // Takes ownership
std::vector<int> myVec = {1, 2, 3, 4, 5};
storeData(std::move(myVec));  // Transfers ownership — myVec is now empty
```

**Inserting into containers efficiently:**

```cpp
std::vector<std::string> names;
std::string name = "Jatin";
names.push_back(std::move(name));  // Move instead of copy
```

**Move-only types like `std::unique_ptr`:**

```cpp
std::unique_ptr<Widget> ptr1 = std::make_unique<Widget>();
std::unique_ptr<Widget> ptr2 = std::move(ptr1);  // ptr1 is now nullptr
// std::unique_ptr<Widget> ptr3 = ptr1;  // ERROR: unique_ptr is not copyable
```

## The noexcept Specifier

Always mark move operations as `noexcept` when possible:

```cpp
Buffer(Buffer&& other) noexcept;
Buffer& operator=(Buffer&& other) noexcept;
```

This matters because `std::vector` and other containers check whether the move constructor is `noexcept` at compile time. During a reallocation (e.g., `push_back` triggers a resize):

- If move is `noexcept` → elements are **moved** to new storage (fast)
- If move might throw → elements are **copied** to maintain strong exception safety

Forgetting `noexcept` on your move operations can silently cause the container to fall back to copying.

## xvalue: The Third Category

C++11 actually has three primary value categories:

- **lvalue** — has identity, cannot be moved from implicitly
- **prvalue** (pure rvalue) — temporary with no identity (`42`, `std::string("hello")`)
- **xvalue** (expiring value) — has identity but is explicitly marked for moving

When you write `std::move(x)`, the result is an **xvalue** — it still refers to `x`, but signals that `x`'s resources can be taken.

```cpp
std::string s = "hello";
std::string&& ref = std::move(s);  // ref is an xvalue referring to s
// s still exists and is valid, but we've signaled it can be moved from
```

## Summary

- **Lvalues** have identity and persist; **rvalues** are temporaries
- Rvalue references (`&&`) let functions distinguish temporaries from persistent objects
- **Move constructors** and **move assignment** steal resources instead of copying them
- `std::move` is just a cast — it marks an lvalue as "safe to move from"
- Always use `noexcept` on move operations so containers can optimize
- After a move, the source object is in a valid but unspecified state — don't rely on its contents

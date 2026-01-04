# Windows Debugging with WinDBG

WinDBG is the definitive debugger for Windows development. Whether you're analyzing crash dumps, debugging kernel issues, or tracing through complex user-mode applications, mastering WinDBG is essential for any Windows systems developer.

## Getting Started

Download WinDBG from the Windows SDK or use the modern **WinDBG Preview** from the Microsoft Store. The preview version offers a significantly improved UI while maintaining compatibility with all classic commands.

### Configuring Symbol Paths

Symbols are critical for meaningful debugging. Set up your symbol path:

```
.sympath srv*C:\Symbols*https://msdl.microsoft.com/download/symbols
.reload
```

This configures WinDBG to:
1. Cache symbols locally in `C:\Symbols`
2. Download from Microsoft's public symbol server

For your own applications, add your PDB location:

```
.sympath+ C:\MyProject\build\Debug
```

## Essential Commands

### Process and Thread Information

```
!process 0 0          // List all processes
!thread               // Current thread info
~                     // List all threads
~*k                   // Stack traces for all threads
```

### Memory Examination

```
dd <address>          // Display DWORDs
dq <address>          // Display QWORDs
da <address>          // Display ASCII string
du <address>          // Display Unicode string
db <address> L100     // Display 0x100 bytes
```

### Breakpoints

```
bp <address>          // Set breakpoint
bp MyModule!Function  // Break on function entry
bu MyModule!Function  // Unresolved breakpoint (for DLLs not yet loaded)
bl                    // List breakpoints
bc *                  // Clear all breakpoints
```

### Stack Analysis

```
k                     // Stack trace
kp                    // Stack with parameters
kv                    // Stack with frame pointer info
.frame <n>            // Switch to frame n
dv                    // Display local variables
```

## Crash Dump Analysis

When analyzing a crash dump (.dmp file), start with:

```
!analyze -v           // Automatic crash analysis
.exr -1               // Display exception record
.cxr                  // Display context record
```

The `!analyze -v` command is incredibly powerful — it often identifies the root cause automatically.

### Common Crash Types

**Access Violation (0xC0000005)**:
```
!analyze -v
// Look at the faulting instruction and address
r                     // Check register values
!address <addr>       // Verify memory region
```

**Stack Overflow (0xC00000FD)**:
```
!analyze -v
k 1000                // Show deep stack
// Look for recursive patterns
```

**Heap Corruption (0xC0000374)**:
```
!heap -p -a <address> // Analyze heap
!heap -s              // Heap summary
```

## Debugging Techniques

### Finding Memory Leaks

Enable application verifier or use the debug heap:

```cpp
// In code, enable debug heap
_CrtSetDbgFlag(_CRTDBG_ALLOC_MEM_DF | _CRTDBG_LEAK_CHECK_DF);
```

In WinDBG:
```
!heap -l              // Find leaked heap blocks
!heap -flt s <size>   // Filter by size
```

### Analyzing Deadlocks

```
!locks                // Display all critical sections
~*kb                  // All thread stacks
!cs -l                // List locked critical sections
!cs <address>         // Critical section details
```

### Time Travel Debugging (TTD)

WinDBG Preview supports Time Travel Debugging — recording program execution and replaying it:

```
!tt.positions         // Show timeline positions
!tt 0                 // Go to start
!tt 100               // Go to end
g-                    // Step backwards
```

This is invaluable for debugging race conditions and heisenbugs.

## Extension Commands

WinDBG's power comes from extensions. Essential extensions include:

- **SOS** (`.loadby sos clr`) — For .NET debugging
- **MEX** — Microsoft's debugging extension pack
- **PSSCOR** — Enhanced .NET debugging

```
.chain                // List loaded extensions
.load <extension>     // Load extension DLL
```

## Tips for Effective Debugging

1. **Always get symbols first** — Debugging without symbols is painful
2. **Use full dump files** — Minidumps miss critical information
3. **Learn the x command** — `x module!*pattern*` finds symbols
4. **Master conditional breakpoints** — `bp func ".if (poi(pVar)>100) {} .else {gc}"`
5. **Script repetitive tasks** — WinDBG has a scripting language

## Quick Reference

| Command | Description |
|---------|-------------|
| `g` | Go (continue execution) |
| `p` | Step over |
| `t` | Step into |
| `gu` | Go up (step out) |
| `r` | Display registers |
| `?` | Evaluate expression |
| `lm` | List modules |
| `.cls` | Clear screen |

## Summary

WinDBG is an essential tool for Windows developers. While the learning curve is steep, the debugging capabilities are unmatched. Start with crash dump analysis using `!analyze -v`, and gradually learn more advanced techniques as needed.

For complex issues, combine WinDBG with other tools like Process Monitor, Dependency Walker, and Application Verifier for a complete debugging workflow.

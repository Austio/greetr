### Working with Ruby Threads

Understand how ruby can take advantage of multiple CPU cores.

#### Definitions

 - Process: Program in memory, has register,counter,stack, heap and code
 - Thread: Unit of execution in a process
 
#### Thread Api (see chapter 1-3 for examples)
 - Thread.main
 - Thread.current
 - (cp1) Thread.new {} # creates and returns a new thread, yields self to block
 - (cp1) Thread.join #join blocks until all threads exit, marries exceptions to current thread
 - Thread.value # joins threads then returns last return value
 - (cp3) Thread.status # `run`, `sleep`, `false` - successfully ran to completion, `nil` - ran but with exception, `aborting` - running but dying
 - (cp3) Thread.stop / Thread.wakeup - stops a thread until
 - Thread.pass - Signals to OS would prefer to stop, not guaranteed
 - Thread.raise - allows one thread to kill another, don't use this, it doesn't run ensure blocks and stack trace is from the parent
 - Thread.kill - stops a thread, same caveats as Thread.raise
 
#### Chapter 1 - Always in a thread
By default there is always 1 thread, the main one.  In ruby when this exits all children threads exit.

```rb
Thread.new { Thread.current == Thread.main }.value
=> false

# start of program
thread = Thread.new { "do lots of work" }

# Have to sleep to prevent main thread from exiting, which could cause child to exit
sleep
```

### Chapter 2 - Threads of Execution

Threads have shared address space: AST (compiled ruby code) and Memory (variables) 

Anything that has a multistep assignment is not thread safe: ||=, Arrays

Ruby Threads map to native threads, threads can be paused and restarted at any time by the OS to ensure fair execution, so we have no way to ensure contiguous flow of execution

Example below fails in this way with two files
 - File 1 creates thread A
 - File 2 creates thread B
 - thread A calls results, begins to look for @results as part of ||=, creates new array, before assignment is paused
 - thread B calls results, begins to look for @results as part of ||=, creates new array and assigns then finishes, @results is [File 2 results]
 - thread A wakes up and finishes assignment then finishes, @results is overwritted to [File 1 results]
 - *boom* we just lost File 2 results

Fix here is to initialize @results eagerly in initialize, not lazily so that we don't have the lookup
```rb
require 'thread'
require 'uploader'
class Upload
  def call(files)
    threads = []
    
    files.each do |f|
      threads = Thread.new do 
        results << Uploader.new(thread)
      end  
    end
    
    threads.join
  end

  def results
    @results ||= []
  end
end
```

Any time that two threads can modify the same data, you can have trouble

#### Chapter 3 - Lifecycles of a thread

 - exceptions in child thread have no affect on parent
 
```rb
t = Thread.new { raise 'hell' }
# all good

t.join
=> RuntimeError: hell
=>        from (irb):7:in `block in irb_binding'

```

 - start/wakeup
```rb
t = Thread.new { Thread.stop; puts "hiya"; }
nil until t.status == "sleep"
t.wakeup
t.join
``` 

#### Chapter 4 - Concurrent vs Parallel
Threads run code concurrently, they could do them in parallel.  Making concurrent code enables parallelization, but does not guarantee it will be executed in parallel, that is the job of the OS scheduler.

 - [Rob Pike: Concurrency is not parralel](https://blog.golang.org/concurrency-is-not-parallelism)
 - [Evan Phoenix Ruby Parallel](https://www.engineyard.com/blog/author/evan-phoenix)

Imagine you have 2 1 day projects, A and B
 - Serially: Do project A then Project B
 - Concurrently: Project A half day, then Project B half day, repeat next day
 - Parallel: You do Project A, another programmer does Project B
 
#### Chapter 5 - GIL and MRI
MRI Global Interpreter Lock (GIL) does not allow parallel execution of ruby code.  It wraps each process in the GIL which prevents Parallelism in ruby MRI.
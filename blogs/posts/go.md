# Golang Logs


*Published on 2025-01-26 in [Programming](../topics/programming.html)*
- [Golang Logs](#golang-notes)
  - [Goroutine](#goroutine)


## Goroutine

In the main thread (which can be thought of as a process), start a goroutine that prints "hello, golang" every 50 milliseconds. Meanwhile, the main thread also prints "hello, golang" every 50 milliseconds. After printing it 10 times, the program exits. The main thread and the goroutine must run concurrently.

```go
func test() {
	for i := 0; i < 10; i++ {
		fmt.Println("test() hello, golang")
		time.Sleep(time.Millisecond * 100)
	}
}

func main() {
	go test() // Start a goroutine (coroutine)
	for i := 0; i < 10; i++ {
		fmt.Println("main() hello, golang")
		time.Sleep(time.Millisecond * 50)
	}
}

```


When we added *go* before test() we can see the test() becomes a corooutine, but the we noticed there is an issue, the main thread ends faster than the test(), so test() will not be able to finish the for loop. To solve this issue, we need to have waitgroup to wait util the test() finish and exit.

```go
var wg sync.WaitGroup

func test() {
    defer wg.Done()
	for i := 0; i < 10; i++ {
		
        fmt.Println("test() hello, golang")
		time.Sleep(time.Millisecond * 100)
	}
    // wg.Done()
}

func main() {
    wg.Add(1)
	go test()
	for i := 0; i < 10; i++ {
		fmt.Println("main() hello, golang")
		time.Sleep(time.Millisecond * 50)
	}
    wg.Wait()
}

```

Once we have wg.Wait() at the end, it will wait until the test() completed and exit.

**Question**: Why do we use *defer wg.Done()* instead *wg.Done()* at the end?

* When error ocurrd during for loop, it won't be able to called wg.Wait() before exit. But the defer wg.Done() will guarantees that wg.Done() is called before the function exits
* If future modifications add new return paths, we don't have to manually add wg.Done() to every return statement.
* If a panic occurs in test(), defer ensures wg.Done() is still executed before the function exits, preventing wg.Wait() from blocking indefinitely.


class Greeter<T> {
  greeting: T
  constructor(message: T) {
    this.greeting = message
  }
  greet() {
    return this.greeting
  }
}

export default Greeter

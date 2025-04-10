import { untrack } from "svelte";

export class Counter {
  counter1 = $state(0);
  counter2 = $state(0);

  incrementCounter1() {
    this.counter1 += 1;
  }

  incrementCounter2() {
    this.counter2 += 1;
  }
}


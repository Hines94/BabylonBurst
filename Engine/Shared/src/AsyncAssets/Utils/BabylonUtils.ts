import { Observable } from "@babylonjs/core";

export function WaitForObservable<T>(
    observable: Observable<T>,
    predicate: (result: T) => boolean,
    timeoutMs: number | undefined = undefined
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | undefined;
  
      const observer = observable.add((result) => {
        if (predicate(result)) {
          observable.remove(observer);
          if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
          }
          resolve(result);
        }
      });
  
      // Optional: Set a timeout to reject the promise if it takes too long
      if (timeoutMs !== undefined) {
        timeoutId = setTimeout(() => {
          observable.remove(observer);
          reject(new Error('Timeout waiting for the observable'));
        }, timeoutMs);
      }
    });
}
  
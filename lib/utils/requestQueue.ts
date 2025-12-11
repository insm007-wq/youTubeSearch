/**
 * 공통 요청 큐 관리 유틸리티 (동시성 제어)
 * - rapidApiClient와 youtubeChannelsClient에서 사용
 * - 동시 요청 수 제한으로 API rate limit 관리
 */

export class RequestQueue {
  private activeRequests = 0
  private queue: Array<() => Promise<any>> = []
  private maxConcurrent: number

  constructor(maxConcurrent: number = 10) {
    this.maxConcurrent = maxConcurrent
  }

  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const task = async () => {
        this.activeRequests++
        try {
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        } finally {
          this.activeRequests--
          this.processQueue()
        }
      }

      if (this.activeRequests < this.maxConcurrent) {
        this.activeRequests++
        fn()
          .then(resolve)
          .catch(reject)
          .finally(() => {
            this.activeRequests--
            this.processQueue()
          })
      } else {
        this.queue.push(task)
      }
    })
  }

  private processQueue() {
    while (this.queue.length > 0 && this.activeRequests < this.maxConcurrent) {
      const task = this.queue.shift()
      if (task) {
        this.activeRequests++
        task()
          .then()
          .catch()
          .finally(() => {
            this.activeRequests--
            this.processQueue()
          })
      }
    }
  }

  getStatus() {
    return {
      activeRequests: this.activeRequests,
      queuedRequests: this.queue.length,
      maxConcurrent: this.maxConcurrent,
    }
  }
}

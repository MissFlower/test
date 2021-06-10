const PENDING = 'PENDING'
const FULFILLED = 'FULFILLED'
const REJECTED = 'REJECTED'
class MyPromise {
  constructor(executor) {
    this.status = PENDING // Promise状态
    this.value = undefined // 成功值
    this.reason = undefined // 失败原因
    this.onFulfilledCallbacks = [] // 成功回调
    this.onRejectedCallbacks = [] ///失败回调

    // 这里resolve reject没有放到constructor外面是因为 ES6中放到外面就是挂载到原型上 而resolve和reject应该是每个实例都应该有的函数
    // Promise.prototype上只有then catch finally方法
    const resolve = value => {
      // 如果状态不是等待,说明状态已经被更改,阻止程序向下执行
      if(this.status !== PENDING) {
        return
      }
      // 将状态更改为成功
      this.status = FULFILLED;
      // 保存成功之后的值
      this.value = value
      // 判断成功回调是否存在 如果存在 就调用
      while(this.onFulfilledCallbacks.length) {
        this.onFulfilledCallbacks.shift()()
      }
    }

    const reject = reason => {
      // 如果状态不是等待,说明状态已经被更改,阻止程序向下执行
      if(this.status !== PENDING) {
        return
      }
      // 将状态更改为失败
      this.status = REJECTED
      // 保存失败之后的原因
      this.reason = reason
      // 判断失败回调是否存在 如果存在 就调用
      while(this.onRejectedCallbacks.length) {
        this.onRejectedCallbacks.shift()()
      }
    }

    try {
      executor(resolve, reject)
    } catch (e) {
      reject(e)
    }
  }

  // 测试用例使用
  static defer = MyPromise.deferred = () => {
    let dfd = {};
    dfd.promise = new MyPromise((resolve, reject) => {
        dfd.resolve = resolve;
        dfd.reject = reject;
    });
    return dfd;
  }

  static resolve(param) {
    // param是MyPromise实例对象
    if (param instanceof MyPromise) {
      return param
    }
    // 不是MyPromise实例对象
    return new MyPromise((resolve, reject) => {
      // 判断param是否存在 是否有then属性 并且then属性是一个函数
      if (param && param.then && typeof param.then === 'function') {
        // 如果是就当是MyPromise处理 直接调用
        setTimeout(() => {
          param.then(resolve, reject)
        })
      } else {
        // 普通值 [] {}
        resolve(param)
      }
    })
  }

  static reject(reason) {
    return new MyPromise((resolve, reject) => {
      reject(reason)
    })
  }

  static all(promises) {
    return new MyPromise((resolve, reject) => {
      let index = 0
      let res = []
      if (promises.length === 0) {
        resolve(res)
      } else {
        const processValue = (i, value) => {
          res[i] = value
          if (++index === promises.length) {
            resolve(res)
          }
        }

        for (let i = 0; i < promises.length; i++) {
          const promise = promises[i];
          // promise可能是一个普通值 走resolve方法过一遍
          // MyPromise.resolve(promise)返回一个MyPromise在走then方法
          MyPromise.resolve(promise).then(value => {
            processValue(i, value)
          }, reason => {
            reject(reason)
            return
          })
        }
      }
    })
  }

  static race(promises) {
    return new MyPromise((resolve, reject) => {
      if (promises.length === 0) {
        return
      } else {
        for (let i = 0; i < promises.length; i++) {
          const promise = promises[i]
          MyPromise.resolve(promise).then(value => {
            // 哪个先拿到值就直接resolve
            resolve(value)
          }, reason => {
            reject(reason)
            return
          })
        }
      }
    })
  }

  then(onFulfilled, onRejected) {
    // onFulfilled和onRejected都是可选参数 需要给默认值
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value
    onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason }
    
    const promise2 = new MyPromise((resolve, reject) => {
      switch (this.status) {
        case FULFILLED:
          setTimeout(() => {
            try {
              let x = onFulfilled(this.value)
              resolvePromise(promise2, x, resolve, reject)
            } catch (e) {
              reject(e)
            }
          })
          break
  
        case REJECTED:
          setTimeout(() => {
            try {
              let x = onRejected(this.reason)
              resolvePromise(promise2, x, resolve, reject)
            } catch (e) {
              reject(e)
            }
          })
          break
  
        case PENDING:
          // 订阅 resolve reject回调函数收集
          this.onFulfilledCallbacks.push(() => {
            setTimeout(() => {
              try {
                let x = onFulfilled(this.value)
                resolvePromise(promise2, x, resolve, reject)
              } catch (e) {
                reject(e)
              }
            })
          })
  
          this.onRejectedCallbacks.push(() => {
            setTimeout(() => {
              try {
                let x = onRejected(this.reason)
                resolvePromise(promise2, x, resolve, reject)
              } catch (e) {
                reject(e)
              }
            })
          })
          break
  
        default:
          break;
      }
    })
    return promise2
  }

  catch(onRejected) {
    return this.then(null, onRejected)
  }

  finally(callback) {
    return this.then(value => {
      return MyPromise.resolve(callback()).then(() => {
        return value
      })
    }, reason => {
      return MyPromise.resolve(callback()).then(() => {
        throw reason
      })
    })
  }
}

function resolvePromise(promise2, x, resolve, reject) {
  // 返回的x和promise2不能是同一个
  if (promise2 === x) {
    return reject(new TypeError('Chaining cycle detected for promise #<Promise>'))
  }

  let called = false
  if ((typeof x === 'object' && x !== null) || typeof x === 'function') {
    // 这里判断之后就可能是一个promise还有可能是一个对象[] {}
    // 如果是promise肯定是有then方法
    try {
      // 这里被trycatch包裹是因为x.then有可能throw Error 比如：x被definedProperty劫持
      // Object.defineProperty(x, then, {
      //   get() {
      //     throw new Error('Error')
      //   }
      // })
      let then = x.then
      if (typeof then === 'function') {
        // 这里就认定是一个promise 虽然无法完全判断 因为可以给一个对象添加then方法 
        then.call(x, y => {
          if (called) { return }
          called = true
          // 递归调用 可能promise嵌套promise
          resolvePromise(promise2, y, resolve, reject)
        }, r => {
          if (called) { return }
          called = true
          reject(r)
        })
      } else {
        // 可能是对象 [] {}
        if (called) { return }
        called = true
        resolve(x)
      }
    } catch (e) {
      if (called) { return }
      called = true
      reject(e)
    }
  } else {
    // 普通值
    if (called) { return }
    called = true
    resolve(x)
  }
}

module.exports = MyPromise


/*
 * @Description: 
 * @Version: 0.1.0
 * @Author: AiDongYang
 * @Date: 2021-04-01 09:59:53
 * @LastEditors: AiDongYang
 * @LastEditTime: 2021-04-01 17:30:40
 */
const MyPromise = require('./lib/promise')

let promise = new MyPromise((resolve, reject) => {
  resolve('SUCCESS')
  // reject('ERROR')
  // throw new Error('Exception Error') 
  // setTimeout(() => {
  //   resolve('OK')
  // })
})

let promise1 = promise.then(value => {
  // return Promise.resolve('Promise Resolve')
  // return 'Then Promise'
  return new MyPromise((resolve, reject) => {
    setTimeout(() => {
      resolve(new MyPromise((resolve, reject) => {
        resolve(new MyPromise((resolve, reject) => {
          resolve('new MyPromise Resolve')
        }))
      }))
    }, 2000);
  })
}, reason => {
  console.log('REJECT1: ' + reason)
})

promise1.then().then().then().then(value => {
  console.log(value)
  throw Error('Error')
}, reason => {
  console.log(reason)
})
.catch(reason => {
  console.log(reason)
})
/*
 * @Description: 
 * @Version: 0.1.0
 * @Author: AiDongYang
 * @Date: 2021-04-07 14:23:00
 * @LastEditors: AiDongYang
 * @LastEditTime: 2021-04-07 15:47:34
 */
const fs = require('fs')
const co = require('co')

function promisify(fn) {
  return function(...arg) {
    return new Promise((resolve, reject) => {
      fn(...arg, (err, data) => {
        if (err) {
          reject(err)
          return
        }o
        resolve(data)
      })
    })
  }
}

const readFile = promisify(fs.readFile)

readFile('./data/number.txt', 'utf-8')
.then(res => {
  return readFile(res, 'utf-8')
})
.then(res => {
  return readFile(res, 'utf-8')
})
.then(res => {
  // console.log(res)
})

// 生成器
function* read() {
  const value1 = yield readFile('./data/number.txt', 'utf-8')
  const value2 = yield readFile(value1, 'utf-8')
  const value3 = yield readFile(value2, 'utf-8')
  return value3
}

// 执行器
function executor(generator) {
  const co = generator()
  return new Promise((resolve, reject) => {
    function next(data) {
      const {value, done} = co.next(data)
      if (done) {
        return resolve(data)
      }
      value.then(res => {
        next(res)
      })
    }
    next()
  })
}
const p = executor(read)
p.then(res => {
  console.log(res)
})

// 使用co模块 也就是封装执行器模块
const p1 = co(read())
p1.then(res => {
  console.log('co结果：' + res)
})

// async await 就是上面的生成器和执行器结合 也就是为什么说是generator的语法糖
async function readAsync() {
  const value1 = await readFile('./data/number.txt', 'utf-8')
  const value2 = await readFile(value1, 'utf-8')
  const value3 = await readFile(value2, 'utf-8')
  return value3
}
const a1 = readAsync()
a1.then(res => {
  console.log('async await:' + res)
})
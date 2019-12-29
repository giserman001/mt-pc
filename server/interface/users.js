import Router from 'koa-router'
// 缓存
import Redis from 'koa-redis'
// 利用nodejs发送电子邮件
import nodeMailer from 'nodemailer'
import UserModel from '../dbs/models/users'
import Email from '../dbs/config'

// 引入axios
import axios from '../interface/utils/axios'
// 引入passport
import Passport from '../interface/utils/passport'

//定义路由前缀
let router = new Router({
  prefix: '/users'
})

// 创建redis客户端
let Store = new Redis().client
router.post('/signup', async (ctx) => {
  const {
    username,
    password,
    email,
    code
  } = ctx.request.body
  // 存储账户信息
  if (code) {
    // 获取存储的code
    const saveCode = await Store.hget(`nodemail:${username}`, 'code')
    // 获取code有效时间
    const saveExpire = await Store.hget(`nodemail:${username}`, 'expire')
    if (code === saveCode) {
      if (new Date().getTime() - saveExpire > 0) {
        ctx.body = {
          code: -1,
          msg: '验证码已过期, 请重新尝试'
        }
        return false
      }
    } else {
      ctx.body = {
        code: -1,
        msg: '请填写正确的验证码'
      }
    }
  } else {
    ctx.body = {
      code: -1,
      msg: '请填写验证码'
    }
  }
  let user = await UserModel.find({
    username
  })
  if (user.length) {
    ctx.body = {
      code: -1,
      msg: '用户名已被注册'
    }
    return
  }
  // 写入数据库
  let nuser = UserModel.create({
    username,
    password,
    email
  })
  if (nuser) {
    // 检查是否写库成功 开启自动登录
    let res = await axios.post('/users/signin', {
      username,
      password
    })
    if (res.data && res.data.code === 0) {
      ctx.body = {
        code: 0,
        msg: '注册成功',
        user: res.data.user
      }
    } else {
      ctx.body = {
        code: -1,
        msg: 'error'
      }
    }
  } else {
    ctx.body = {
      code: -1,
      msg: '注册失败'
    }
  }
})

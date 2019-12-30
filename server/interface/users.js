import Router from 'koa-router'
// 缓存
import Redis from 'koa-redis'
// 利用nodejs发送电子邮件
import nodeMailer from 'nodemailer'
import UserModel from '../dbs/models/users'
import config from '../dbs/config'

// 引入axios
import axios from './utils/axios'
// 引入passport
import Passport from './utils/passport'

//定义路由前缀
let router = new Router({
  prefix: '/users'
})

// 创建redis客户端
let Store = new Redis().client
// 注册
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

// 登录
router.post('/signin', async (ctx, next) => {
  return Passport.authenticate('local', (err, user, info, status) => {
    if (err) {
      ctx.body = {
        code: -1,
        msg: err
      }
    } else {
      if (user) {
        ctx.body = {
          code: 0,
          msg: '登录成功',
          user
        }
        return ctx.login(user)
      } else {
        ctx.body = {
          code: 1,
          msg: info
        }
      }
    }
  })(ctx, next)
})
// 验证码
router.post('/verify', async (ctx, next) => {
  let username = ctx.request.body.username
  const saveExpire = await Store.hget(`nodemail:${username}`, 'expire')
  if (saveExpire && Date().getTime() - saveExpire < 0) {
    ctx.body = {
      code: -1,
      msg: '验证请求过于频繁,一分钟内一次'
    }
    return false
  }
  // 腾讯权限邮箱配置
  let transporter = nodeMailer.createTransport({
    host: config.smtp.host,
    port: 587,
    secure: false,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass
    }
  })
  let ko = {
    code: config.code(),
    expire: config.expire(),
    email: ctx.request.body.email,
    user: ctx.request.body.user
  }
  let mailOptions = {
    from: `认证邮箱<${config.smtp.user}>`,
    to: ko.email,
    subject: '《无敌就是寂寞》注册码',
    html: `您在《无敌就是寂寞》课程中注册，您的邀请码是${ko.code}`
  }
  await transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log('error')
    } else {
      Store.hmset(`nodemail:${ko.user}`, 'code', ko.code, 'expire', ko.expire, 'email', ko.email)
    }
  })
  ctx.body = {
    code: 0,
    msg: '验证码已发送，可能会有延时，有效期一分钟'
  }
})


// 退出
router.get('/exit', async (ctx, next) => {
  await ctx.logout()
  if(!ctx.isAuthenticated()) {
    ctx.body = {
      code: 0,
      msg: '退出成功'
    }
  } else {
    ctx.body = {
      code: -1,
      msg: '退出失败'
    }
  }
})

// 获取用户名

router.get('/getUser', async (ctx) => {
  if(ctx.isAuthenticated()) {
    const {username, email} = ctx.session.passport.user
    ctx.body = {
      code: 0,
      user: username,
      email,
      msg: '获取用户信息成功'
    }
  } else {
    ctx.body = {
      user: '',
      email: '',
      code: -1,
      msg: '未登录，获取用户信息失败'
    }
  }
})


export default router

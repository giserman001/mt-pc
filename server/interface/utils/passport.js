import passport from 'koa-passport'
import LocalStrategy from 'passport-local'

import UserModel from '../../dbs/models/users'

// 用户验证
passport.use(new LocalStrategy(async (usename, password, done) => {
  // 数据库查出来的
  let res = await UserModel.findOne({
    usename
  })
  if (res) {
    if (res.password === password) {
      return done(null, res)
    } else {
      return done(null, false, '密码错误')
    }
  } else {
    return done(null, false, '用户不存在')
  }
}))

// 用户每次进来通过session来验证
passport.serializeUser((user, done) => {
    done(null, user)
})
passport.deserializeUser((user, done) => {
    return done(null, user)
})
export default passport

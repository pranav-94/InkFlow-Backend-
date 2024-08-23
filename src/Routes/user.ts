import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import  validateUser  from '../zod'
import { jwt,sign,verify } from 'hono/jwt'

export const userRouter = new Hono<{
    Bindings: {
     DATABASE_URL: string,
         JWT_KEY: string,
    },
    Variables: {
         userId: string
    }
 }>()

 userRouter.use('/lol/*',async(c,next)=>{
  const header = c.req.header("token")

    if(!header){
        return c.json({
            msg: 'token not provided'
        })
    }
    
    try{
    const data:any = await verify(header,c.env.JWT_KEY)
    if(!data){
        return c.json({
            data: 'jwt auth failed'
        })
    }

    c.set('userId',data.id)
    await next()
    }

    catch(err){
        return c.json({
            msg: 'jwt failed'
        })
    }
 })

userRouter.post('/signUp', async(c) => {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())
  
     const signUpData = await c.req.json()
  
     const validateUserData:any = validateUser.validateUser.safeParse({
          email: signUpData.email,
          name: signUpData.username,
          password: signUpData.password
     })
  
     try{
    const createUser = await prisma.user.create({
      data:{
      email: validateUserData.data.email,
      name: validateUserData.data.name,
      password: validateUserData.data.password
      }
    })
  
  
    const token = await sign({id:createUser.id},c.env.JWT_KEY)
  
    return c.json({
      token: token,
      username: createUser.name
    }) 
  
  }
  catch(err){
    return c.json({
      msg: 'error signing up'
    })
  }
  })
  
  userRouter.post('/signIn',async(c)=>{
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())
      
     const signInData:any =await c.req.json()
  
     try{
        const user = await prisma.user.findUnique({
        where: {
          email: signInData.email,
          password: signInData.password
        }
     })
  
     if(!user){
      return c.json({
        message: "user does't exist"
      })
     }
  
     const token = await sign({id:user?.id},c.env.JWT_KEY)
  
     return c.json({
      token: token,
      username: user.name
     })
    }
  
    catch(err){
      return c.json('sign in failed')
    }
  
  })

  userRouter.get('/allData',async(c)=>{

    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())

   try{
    const userData = await prisma.user.findMany({})
    return c.json({data:userData})
   }
   catch(err){
     return c.json({err: err})
   }

  })

  userRouter.put('/lol/userBio',async(c)=>{
      const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
      }).$extends(withAccelerate())

      const userData = await c.req.json()
      const userId = c.get('userId')

     const userInfo = await prisma.user.update({
        where: {
          id: userId
        },
        data:{
          description: userData.description,
          name: userData.name,
        }
      })

      return c.json({
        data: userInfo
      })
  })


  userRouter.put('/lol/updateEmail',async(c)=>{
    const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const userData = await c.req.json()
    const userId = c.get('userId')

    const validateUserData:any = validateUser.validateEmail.safeParse(userData.email)

 console.log(validateUserData)

 if(validateUserData.success===false){
  return c.json({
    msg: 'Invalid email'
  })
 }

   const userInfo = await prisma.user.update({
      where: {
        id: userId
      },
      data:{
        email: validateUserData.data
      }
    })

    return c.json({
      data: 'done'
    })
})



  userRouter.post('/lol/deleteUser',async(c)=>{

    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())

        const data:any = await c.req.json()
        const userId:any = c.get('userId')
        console.log(userId)

      try{
        const allPosts =  await prisma.post.deleteMany({
          where: {
            authorId: userId
          }
        })

        const user = await prisma.user.delete({
          where:{
            id: userId
          }
        })

       return c.json({
          msg: 'done',
          posts: allPosts,
          user: user
        })
      }
      catch(err){
        return c.json({
          msg: err
        })
      }
  })
  
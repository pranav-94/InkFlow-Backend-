import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { Hono } from "hono";
import { jwt,verify } from "hono/jwt";

export const blogRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string,
        JWT_KEY: string,
    },
    Variables: {
        userId: string
    }
}>()

//jwt auth
blogRouter.use('/*',async(c,next)=>{
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

blogRouter.get('/',async(c)=>{
   const UserId = c.get('userId')
     return c.json({
        msg: 'jwt done',
        id: UserId
     })
})

blogRouter.post('/create',async(c)=>{

    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const userId = c.get('userId')
    const blogData =await c.req.json()

    const date = new Date();
    const options:any = { year: 'numeric', month: 'long', day: 'numeric' };
    const monthYear = date.toLocaleDateString('en-US',options);
    console.log(monthYear);  

    // try{

    const author:any = await prisma.user.findFirst({
        where: {
            id: userId
        }
    })
    if (!author) {
        // Handle the case where no user is found
        return c.json({msg:`User with ID ${userId} not found.`});
        // You might want to throw an error or return a specific value
      }

    const createPost = await prisma.post.create({
//@ts-ignore
        data: {
            title: blogData.title,
            content: blogData.content,
            authorId: userId,
            date: monthYear,
            authorName: author?.name
        }
    })
    return c.json({id: createPost.id})
    

    // catch(err){
    //     return c.json({msg: 'createPost'})
    // }

})

blogRouter.put('/update',async(c)=>{
      const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
     
    const updateData:any =await c.req.json()
    const userId = c.get('userId')

    try{
    await prisma.post.update({
        where: {
            id: updateData.id,
            authorId: userId
        },
        data: {
            title: updateData.title,
            content: updateData.content
        }
    })

    return c.json({
        msg: 'updated post',
        id: updateData.id
    })
}

catch(err){
    return c.text('error updating post')
}

})

blogRouter.get('/get/:id',async(c)=>{

    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
    
    const id = c.req.param("id")

try{
    const post = await prisma.post.findFirst({
        where: {
            id: id
        }
    })

    const authorInfo = await prisma.user.findFirst({
        where: {
            id: post?.authorId
        }
    })

    return c.json({
        post: post,
        authorName: authorInfo?.name,
        authorDescription: authorInfo?.description
    })
}
catch(err){
    return c.json({msg: 'post not found'})
}

})

blogRouter.get('/bulk',async(c)=>{

    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    try{
    const allPosts:any = await prisma.post.findMany({
        select: {
            title:true,
            content: true,
            id: true,
            date: true,
            author:{
                select:{
                    name: true
                }
            }
        }
    })

    return c.json({
        data:allPosts
    })
    }

    catch(err){
    return c.json({err: 'error'})
    }

})

blogRouter.delete('/deleteBlog',async(c)=>{

    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const blogId = await c.req.json()
    const userId = c.get('userId')

    try{
        const res = await prisma.post.delete({
        where:{
            id: blogId.id,
            authorId: userId
        }
    })
        return c.json({msg: 'done'})
}
    catch(err){
        return c.json({msg: err})
    }
})
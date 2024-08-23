import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { userRouter } from './Routes/user'
import { blogRouter } from './Routes/blog'

const app = new Hono()

app.use('/api/*', cors())

app.route('/api/user',userRouter)
app.route('/api/blog',blogRouter)


export default app

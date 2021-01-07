import { Request, Response } from 'express'
import * as portalService from './portal.service'

export async function auth(req: Request, res: Response): Promise<void> {
  console.log('req.body', req.body)
  const {user, token} = await portalService.auth(req.body.login, req.body.password) 
  res.setHeader('token', token)
  res.status(200).send(user)
}
export async function withTokenGet(req: Request, res: Response): Promise<any>{
  const {user, token} = await portalService.loginWithToken(req.body.token as string)
  res.setHeader('token', token)
  res.status(200).send(user)
}
export async function googleLoginPost(req: Request, res: Response): Promise<void> {
  console.log('req', req)
  const {user, token} = await portalService.loginWithGoogle(req.body)
  res.setHeader('token', token)
  res.status(200).send(user)
}
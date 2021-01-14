import { Request, Response } from 'express'
import * as portalService from './portal.service'

export async function auth(req: Request, res: Response): Promise<void> {
  console.log('req.body', req.body)
  const gameData = await portalService.auth(req.body.email, req.body.password) 
  res.setHeader('token', gameData.token)
  res.status(200).send(gameData)
}
export async function withTokenGet(req: Request, res: Response): Promise<any>{
  const gameData = await portalService.loginWithToken(req.body.token as string)
  res.setHeader('token', gameData.token)
  res.status(200).send(gameData)
}
export async function googleLoginPost(req: Request, res: Response): Promise<void> {
  const gameData = await portalService.loginWithGoogle(req.body)
  res.setHeader('token', gameData.token)
  res.status(200).send(gameData)
}
export async function facebookLoginPost(req: Request, res: Response): Promise<void> {
  const gameData = await portalService.loginWithFacebook(req.body)
  res.setHeader('token', gameData.token)
  res.status(200).send(gameData)
}
export async function signUpPost(req: Request, res: Response): Promise<void> {
  console.log('req', req)
  const gameData = await portalService.signUp(req.body)
  res.setHeader('token', gameData.token)
  res.status(200).send(gameData)
}
import { Request, Response } from 'express'
import createHttpError from 'http-errors'
import { StatusCodes } from 'http-status-codes'
import { queryScalar } from '../../db'
import { verifyToken } from '../../services/jwtService'
import { getGameUserByDeviceEmail } from '../meta/meta.repo/gameUser.repo'
import { rafflePurchase } from '../meta/meta.repo/raffle.repo'
import { getCardTrade } from '../slot/slot.services/card.service'
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
export async function activationPost(req: Request, res: Response): Promise<void> {
  console.log('req', req)
  const gameData = await portalService.activation(req.body.token)
  res.setHeader('token', gameData.token)
  res.status(200).send(gameData)
}
export function googleCallback(req: Request, res: Response): void {
  console.log('req', req)
  res.status(200).send(req)
}
export async function portalWinnersGet(req: Request, res: Response): Promise<void> {
  const data = await portalService.getWinners()
  res.status(200).send( data )
}
export async function portalProfileGet(req: Request, res: Response): Promise<void> {
  const data = await portalService.getProfile(Number(req.query.id))
  res.status(200).send( data )
}
export async function portalProfilePost(req: Request, res: Response): Promise<void> {
  const data = await portalService.postProfile(req.body)
  res.status(200).send( data )
}
export async function portalPasswordPost(req: Request, res: Response): Promise<void> {
  const data = await portalService.postPassword({id: Number(req.body.id), password: req.body.password as string})
  res.status(200).send( data )
}
export async function portalForgotPasswordPost(req: Request, res: Response): Promise<void> {
  await portalService.postForgotPassword(req.body.email as string)
  res.status(200).send( {status: 'ok'} )
}
export async function portalEmailPost(req: Request, res: Response): Promise<void> {
  const data = await portalService.postEmail({id: Number(req.body.id), email: req.body.email as string})
  res.status(200).send( data )
}
export async function portalRafflesGet(req: Request, res: Response): Promise<void> {
  const user = await portalService.getPortalUserByEmail(req.query.email as string)
  if(!user) throw createHttpError(StatusCodes.BAD_REQUEST, 'User not found in rafflesPrizeDataGet')
  const data = await portalService.getRaffles(req.query.email as string, true)
  res.status(200).send( data )
}
export async function portalCardCollectionsGet(req: Request, res: Response): Promise<void> {
  const user = await getGameUserByDeviceEmail(req.query.email as string)
  if(!user) throw createHttpError(StatusCodes.BAD_REQUEST, 'User not found in rafflesPrizeDataGet')
  const data = await portalService.getCards(user.id)
  res.status(200).send( data )
}
export async function rafflePurchaseGet(req: Request, res: Response): Promise<any>{
  const resp = await rafflePurchase(
    req.query.deviceId as string,
    Number(req.query.raffleId),
    Number(req.query.amount)
  )
  res.status(200).json(resp)
}
export async function cardTradeGet(req: Request, res: Response): Promise<void> {
  // console.log('req', req)
  // console.log('req', req.query)
  // console.log('req', req.body)
  const token = req.headers.token
  const { decodedToken, error } = verifyToken(token as string)
  console.log('decodedToken', decodedToken, error)
  if(error) throw createHttpError(StatusCodes.BAD_REQUEST, 'invalide token')
  const userId: string = decodedToken.id
  const gameUserId = Number(await queryScalar(`
      select gu.id from game_user gu
        inner join game_user_portal gup on gup.email = gu.email
      where gup.id = ${userId}
  `))
  const cardTradeData = await getCardTrade(req.query.regular as string, gameUserId)

  res.status(200).send(cardTradeData)

}
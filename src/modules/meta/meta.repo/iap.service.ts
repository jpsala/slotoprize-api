import { exec } from "../../../db"
import { GameUser } from "../meta.types"

export async function iap(user: GameUser, adsFree: string): Promise<void> {
 await exec(`update game_user set adsFree = ? where id = ?`, [adsFree, user.id])
}
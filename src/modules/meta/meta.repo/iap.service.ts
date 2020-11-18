mkknjjnnimport { queryExec } from "../../../db"
import { GameUser } from "../meta.types"

export async function setIap(user: GameUser, adsFree: string): Promise<void> {
 await queryExec(`update game_user set adsFree = ? where id = ?`, [adsFree, user.id])
}
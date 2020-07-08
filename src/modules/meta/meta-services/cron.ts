import createError from 'http-errors'
import camelcaseKeys from 'camelcase-keys'
import {compareAsc, formatDistanceToNow} from 'date-fns'
import {RafflePrizeData} from "../meta.types"
import {queryMeta} from "../meta.db"
import {raffleTime} from '../meta.repo/raffle.repo'
// import {format, addSeconds} from 'date-fns'
const interval = 5001
interface Task {
  raffle: RafflePrizeData;
  distance: string;
}
type Tasks = Task[]
const tasks: Task[] = []
async function cron():Promise<void> {
  console.log('Cron initialized')
  await addRafflesAsTasks()
  setInterval(await checkIfTimeForTask, interval)
  await checkIfTimeForTask()
}
const checkIfTimeForTask = async ():Promise<void> => {
  for (const task of tasks) {
    const closingDate = new Date(task.raffle.closingDate)
    const now = new Date()
    const isPending = (compareAsc(closingDate, now) > 0)
    const distance = formatDistanceToNow(closingDate)
    // const nowFormatted = format(now, 'dd/MM hh:mm:ss')
    // const closingDateFormatted = format(closingDate, 'dd/MM hh:mm:ss')
    task.distance = distance
    if (isPending) console.log('Pendiente, falta %O', task.distance)
    else {
      const resp = await raffleTime(task.raffle)
      const taskIdx = tasks.findIndex((taskToDelete) => taskToDelete.raffle.id === task.raffle.id)
      tasks.splice(taskIdx, 1)
      console.log('Procesado, vencido, ganador ', resp)
    }
  }
}
export const addRaffleAsTask = (raffle: RafflePrizeData): void => {
  const camelCasedRaffle = camelcaseKeys(raffle) as RafflePrizeData
  const closingDate = new Date(camelCasedRaffle.closingDate)
  console.log('task added', raffle, formatDistanceToNow(closingDate))
  tasks.push({
    distance: formatDistanceToNow(closingDate),
    raffle: camelCasedRaffle
  })
}
const addRafflesAsTasks = async (): Promise<void> => {
  const rafflesRows: RafflePrizeData[] = await queryMeta(`
    select * from raffle r
    where winner is null
  `)
  for (const raffle of rafflesRows) {
    raffle.localizationData = await queryMeta(`
      select * from raffle_localization where raffle_id = ${raffle.id}
    `)
    if(raffle.localizationData.length < 1) throw createError(createError.InternalServerError, 'raffle whithout localiztion data')
    addRaffleAsTask(raffle)
  }
}
export const getPendingTasks = (): Task[] => {
  return tasks
}
cron()


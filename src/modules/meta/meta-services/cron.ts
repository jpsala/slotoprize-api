/* eslint-disable babel/no-unused-expressions */
/* eslint-disable no-process-env */
import createError from 'http-errors'
import camelcaseKeys from 'camelcase-keys'
import {compareAsc, formatDistanceToNow} from 'date-fns'
import {RafflePrizeData} from "../meta.types"
import {query} from "../../../db"
import {raffleTime} from '../meta.repo/raffle.repo'
// import {format, addSeconds} from 'date-fns'
const interval = 5001
interface Task {
  raffle: RafflePrizeData;
  distance: string;
}
type Tasks = Task[]
const tasks: Task[] = []
const testing = process.env.NODE_ENV === 'testing'
async function cron():Promise<void> {
  await addRafflesAsTasks()
  if (!testing) {
    console.log('Cron initialized')
    setInterval(checkIfTimeForTask, interval)
  }
  await checkIfTimeForTask()
}
const checkIfTimeForTask = ():void => {
  for (const task of tasks) {
    const closingDate = new Date(task.raffle.closingDate)
    const now = new Date()
    const isPending = (compareAsc(closingDate, now) > 0)
    const distance = formatDistanceToNow(closingDate)
    // const nowFormatted = format(now, 'dd/MM hh:mm:ss')
    // const closingDateFormatted = format(closingDate, 'dd/MM hh:mm:ss')
    task.distance = distance
    if (isPending && !testing)
      console.log('Pendiente, falta %O', task.distance)
    else
      raffleTime(task.raffle).then((resp) => {
        const taskIdx = tasks.findIndex((taskToDelete) => taskToDelete.raffle.id === task.raffle.id)
        tasks.splice(taskIdx, 1)
        // if(!testing) console.log('Procesado, vencido, ganador ', resp)
      }).catch((err) => {
        console.log('error en checkIfTimeForTask', err)
      })

  }
}
export const addRaffleAsTask = (raffle: RafflePrizeData): void => {
  const camelCasedRaffle = camelcaseKeys(raffle)
  const closingDate = new Date(camelCasedRaffle.closingDate)
  // if(!testing)console.log('task added', raffle, formatDistanceToNow(closingDate))
  tasks.push({
    distance: formatDistanceToNow(closingDate),
    raffle: camelCasedRaffle
  })
}
const addRafflesAsTasks = async (): Promise<void> => {
  const rafflesRows: RafflePrizeData[] = await query(`
    select * from raffle r
    where winner is null
  `)
  for (const raffle of rafflesRows) {
    raffle.localizationData = await query(`
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


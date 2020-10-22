import { getSetting, setSetting } from "./settings.service"

export async function getSpinSettingsForCrud(): Promise<any>{
  return {lapseForSpinRegeneration: Number(await getSetting('lapseForSpinRegeneration', '10')),
    maxSpinsForSpinRegeneration: Number(await getSetting('maxSpinsForSpinRegeneration', '10')),
    
  }
}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function setSpinSettingsForCrud(values: any): Promise<void>{
  if(values.lapseForSpinRegeneration) await setSetting('lapseForSpinRegeneration', values.lapseForSpinRegeneration)
  if(values.maxSpinsForSpinRegeneration) await setSetting('maxSpinsForSpinRegeneration', values.maxSpinsForSpinRegeneration)
}
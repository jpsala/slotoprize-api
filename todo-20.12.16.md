En el backoffice
- [x] cambiar daily reward x por Reward Calendar
- [x] agregar los cuatro chest

y a su vez, habrá 4 chests, definidos en el backoffice y que me enviarás en reward_calendar

public class RewardCalendarData
{
    public int consecutiveLogsIdx;
    public int totalLogsClaimed; //*
    public List<RewardData> rewards;
    public bool dailyRewardClaimed;
    public List<RewardChestData> rewardChests; //*
}

rewardChestData:
renombrar:
- [x priceAmount a amount
- [x] priceCurrency a currency
  agregar
- [x]    claimed: bool
- [x]    id (se devuelve en los endpoints)

- [x] por cada chest, tenemos que guardar de cual ya hizo claim, para que no lo pueda cobrar 2 veces

- [x] y además, cada chest tendrá un valor asignado en días, que definirá si puede ser cobrado

- [x] Los chest pasan a una tabla propia
  pasar los chest de los settings a la tabla

en dailyRewardClaim:
- [x]   ahora devuelve la billetera, tiene que devolverla anidada con los valores  anteriores a asignar el reward del chest, devolver con el dayly reward sin el chest y el indice del chest (chestGrantedId) in en caso de no tener un chest reward va en -1

- [x] bordes en el bo en reward calendar
- [x] quitar los #ids y que queden como un campo más

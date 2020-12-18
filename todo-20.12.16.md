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
    priceAmount a amount
    priceCurrency a currency
  agregar
    claimed: bool
    id (se devuelve en los endpoints)

por cada chest, tenemos que guardar de cual ya hizo claim, para que no lo pueda cobrar 2 veces

y además, cada chest tendrá un valor asignado en días, que definirá si puede ser cobrado

eso no sé donde meterlo aun, 

si reutilizar el prize del chest,

o ponerlo aparte

Los chest pasan a una tabla propia
  pasar los chest de los settings a la tabla

en dailyRewardClaim:
  ahora devuelve la billetera, tiene que devolverla anidada con los valores anteriores a asignar el reward del chest, devolver con el dayly reward sin el chest.
  y el indice del chest (chestGrantedId) in en caso de no tener un chest reward va en -1

bordes en el bo en reward calendar
quitar los #ids y que queden como un campo más
en live el campo totalLogsClaimed se inicializa con el contenido en 0
en live cambiar el campo last a last_login en last_spin
en el daily rewards en el BO en los chests va una pequeña leyenda: "* chest amount indicates the number of days and currency can be ignored"
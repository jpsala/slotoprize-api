******************************************************************************************************************
>en todos los endpoints de raffles:
>en vez de localization data mandar name y description

- [x] rafflesGet
- [x] rafflePurchaseHistoryGet
- [x] rafflePurchaseGet
- [x] raffleWinnersGet

******************************************************************************************************************
endpoint
>en game_int raffle_prizes_data se va y pasa a un endpoint propio sin el wrapper
******************************************************************************************************************
>en todas las fecha va raw
******************************************************************************************************************
en gameInit va:
>hasPendigPrize en 1 cuando gana
>languageCode el que está guardado para el usuario o el que va por defecto, guardar eng_US por defecto
>requireProfileData en 1 si gana (si es que no está completo el profile) cuando recibo el proviel se pasa a 0
******************************************************************************************************************
>endpoint nuevo
>params: id_del_premio
>no devuelve nada
>y si es 1 haspendigPrize vuelve a 0 (va en un campo de la tabla del usuario)
******************************************************************************************************************
>purchase_raffle devuelve error
******************************************************************************************************************
~~raffleDate cambiar por closingDate~~
******************************************************************************************************************

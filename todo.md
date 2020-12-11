.opcion para borrar un lenguage
- [ ] validación para el raffle
- [ ] evitar cambiar el raffle una vez que se fué de live



si isNew, !tutorialComplete no le mano el daily reword ni eventos activos 
cada vez que aplico los resultados de un evento no lo aplico si isNew

cuando completa el turotial puede ir 'tutorialComplete = true' en este caso se reinicia la billetera

daily eventos y notificaciones en general y en game-init daily reward vacio

TODO:

tutorialComplete = false {
 - [x]  todo lo que devuelve es prearmado
 - [x]  en el spin coincide el spin ganador con la billetera de settings
 - [x]  no va ninguna recompensa
 - [x]  en game-init Devuelvo dailyRewardClaimed en true
 - [x]  en game-init devuevo  0 0 y 1 spin
}


- [ ] cambiamos login info por stats
- [ ] agregamos total spins played
- [ ] support scroll
- [ ] Backend: #107, #116, #117, #118, 
- [ ] Backoffice: #58, #60, #61, #63, #64


02/12
- [ ] regeneracion del atlas cuando agregan o quitan una carta, cambian un thumbnail, o cambian el setting the frontCardId
- x] frontCardId en el set, y viene en el endpoint.
- [ ] agendar el setting para definir frontCardId en cada set, en el bo
- [x] spin endpoint tweaks: quitar campos del set, agregar textureUrl
- [ ] assign a front card for all the card sets and remove the code in getCardsCL where cardSet.frontCardId is assigned when is undefined, an exception has to be raised if not frontCardId is assigned instead

- [x] en cardset.cards el set id
- [ ] en cardcollection si una carta no tiene quantity no mando el texture
//URGENT arreglar esto!!!!
- [ ] rules en eventos no funcionan si son mayores 20 dias
- [ ] validar symbol que el nombre no esté vacio


- [ ] quitar todo lo que sea de ironsource, incluseo en la db
- [ ] drop rate table da un error si cambian los ids, solo anda con el primer indice en 0
- [ ] poner un loading spinner en los cards
- [ ] setting game-versio no va mas!
- [ ] por que no estábamos teniendo en cuenta el multiplier cuando es ticket

11 del 12
- [ ] 2 settings en el BO: en balance: 
      public int incomingRaffleThresholdInDays = 5;
      public int nextRaffleSessionSpins = 7;
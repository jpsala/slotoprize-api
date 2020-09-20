- [x] Load countries data to db

borrar los datos existentes y los vuelvo a ingresar
* Here is a spreadsheet with preliminary countries data.
https://docs.google.com/spreadsheets/d/1QMV21piDwCGRIXfFXj3cKC76w6brdFHT_5_Qoffsbb8/edit#gid=1124685665
Later on, the admin front end will have a crud for countries, but we can load this data by ourselves now.



------
- [x] ProfileData new field
@jpsala we need a new field on players Profile Data, only to be set through the back office, a bool value named "isDev".
que vaya siempre con el profile-data y se modifica en el front
------
- [x] Game Init new field - interstitialsRatio
We need a new field on the Game-Init response: "interstitialsRatio". Is an integer that
will be obtained from the game's producer, through a backoffice setting.

cada cuantos spins le va a mostrar una publicidad
front - add settings - intersticials ratio ticket front #15
------
- [x] Daily Rewards Changes
We need to tweak the system in order to:

provide a reward from the very first day, instead of the second as we do now.
when max days are reached, keep granting the last reward if consecutive daily logs keeps increasing.
allow the rewards to grant spins as well (now that we have spins as currency).
3 cambios:
daily reward dia ahora se paga a partir del día cero
se le sigue pagando el del último día
se puede agregar spins al tipo de pago
-------
- [x] Game-init members requireProfileData and hasPendingPrize need changes to consider jackpot (besides raffles, as the current backend code does).
If player has a pending prize (thus, hasPendingPrize is true), it can either be a jackpot or a raffle. So we need a new bool in game-init stating the type of the pending prize, named "pendingPrizeIsJackpot" (true for jackpot, false for raffle).
Also, if the pending prize is a raffle, game-init shall include its data, in a field named "rafflePrizeData" (which will hold the rafflePrizeData).
If its a jackpot, hasPendingPrize will be true, pendingPrizeIsJackpot will be true, but rafflePrizeData wont be sent.

[x] haspendig prize hasta ahora se contempla que haya ganado una rifa, que se ponga en true con un jackpot, valor nuevo que diga que tipo de premio ganó - pendigPrizeIsJackpot (más pendingPrize in true) si gana un raffle devolver el raffle prize que ganó
3 considere el haspendingprize es jackpot
-------
- [] Wallet - Spins Regeneration
Spins will auto-regenerate over time at a ratio defined in the backoffice, and to a maxium also defined in the backoffice. When a new spin is available in the player wallet due to regeneration, if client is online, the backend must send the information.

--------
- [] Wallet - New "Spins" currency
Wallet will now have a new currency "spins", besides coins and tickets. Coins wont be used for the slot machine anymore. Slot machine spins will now only consume spins from the wallet, instead of coins. Each spin will consume the number of spins determined by the multiplier, just as before it affected the bet amount.

Ie:

Player spins with multiplier = 1. Results on Standard paytable gains, and one spin discounted from wallet.
Player spins with multiplier = 3. Results on 3 x paytable gains, and 3 x spins discounted from wallet.
Spins will be credited from different sources:

Regeneration (see #40).
Daily Rewards (see #38).
Player watching rewarded ads (see #47).
Slot Machine wins (see #46).
--------
- [x] Game Init - hasPendingPrize and requireProfileData changes
Game-init members requireProfileData and hasPendingPrize need changes to consider jackpot (besides raffles, as the current backend code does).

If player has a pending prize (thus, hasPendingPrize is true), it can either be a jackpot or a raffle. So we need a new bool in game-init stating the type of the pending prize, named "pendingPrizeIsJackpot" (true for jackpot, false for raffle).

Also, if the pending prize is a raffle, game-init shall include its data, in a field named "rafflePrizeData" (which will hold the rafflePrizeData).

If its a jackpot, hasPendingPrize will be true, pendingPrizeIsJackpot will be true, but rafflePrizeData wont be sent.

**hasPendingPrize luego de mandarlo por el gameInit vuelve a false**

--------
- [x] Slot Machine Spins Economy Changes
Coins wont be used for the slot machine anymore. Slot machine spins will now only consume spins from the wallet, instead of coins. Each spin will consume the number of spins determined by the multiplier, just as before it affected the bet amount.

Ie:

Player spins with multiplier = 1. Results on Standard paytable gains, and one spin discounted from wallet.
Player spins with multiplier = 3. Results on 3 x paytable gains, and 3 x spins discounted from wallet.
betPrice will no longer affect the wallet on spins, but will be used for the price of the spin currency, when the player exchanges coins for spins.

betPrice
=========
Websockets - Raffle Winner Notification
If player is connected when raffle is draw, and results a winner, we need an event to notify him, as we currently do using websockets. If he is not online, we use the game-init flags as usual.

msgType: "raffleWin",
payload: <json of raffle prize data>

sin en el momento del sorteo el tipo está conectado se le manda una notificación con los detalles del ticket
------------------
- [x] Slot Machine Symbol Changes
We have a few changes to incorporate to the slot machine mechanics:

The slot machine will be able to pay only with the new "spins" currency. So slot machine wins can pay coins, spins, tickets or jackpot.
Instead of defining the payout by the symbol type, we need to define the payout type manually for each symbol.
We still need "paymentType" in the symbol for pure internal gameplay reasons, but can be renamed to "symbolType" to make code more clear.
The place to send the type of win gains (coin, spin, ticket or jackpot) remains the same, that is spinResultData.winData.type


ahora tenemos un currency nuevo y necesitamos:
ahora es ticket, coins, jackpot
ahora ganas spins tbn
el 2do cambio es que en vez de regir que paga por símbolo por nombre, cada símbolo es definible lo que paga
paymantType se sigue mandando
las ganancias ya las estaba mandand en el spinResultData, ahora va un valor nuevo que es spin
lo que tiene ahora pasa a ser el nombre
jackpot de acuerdo al paymantType
para preguntar si solo puede haber una linea en el paytable de ticket

------------------

- [x] Iron Source callback endpoints and mechanics
IronSource (the ads provider) requires a few endpoints to report stuff, and in time we need to do our things with the info received from them.

Client request and watches an Ad -> IronSource sends success or error data to our backend -> the backend credits (or not) the player, and comunicates to the client.

This is just a stub, we need to elaborate on meetings.

la integración con un solo SDK que hace de puente
el cliente se comunica con el proveedor y pide un video, el preveedor avisa cuando el cliente terminó de ver, se comunica con el backend, 2 endpoints, success y error
success le acredito las ganancias que manda el proveedor y mando evento

el tipo de reward lo manejamos nosotros, rewarded videos spins y offerwall coins, para definir en el front, el server manda el reward como un número pero no dice de qué


------------------
- [x] EventData changes
Event data will have some changes on data and structure.

The field "skin", should be renamed to "skinData".
Instead of "notificationMessage" and "notificationTextureUrl" we will now have a "notificationData" field in the format we already use for notifications.
New field named "particlesData", wich is an object (displayer below). On the backoffice, producer will be able to set a texture for the event particles.
Instead of "popupMessage" and "popupTextureUrl;" we will now have a "popupData" field (structure exposed below). On the backoffice, producer will be able to set a texture, title, and message for the popup.
Field "betPrice" should be removed (spins wont have a price anymore, each spin will consume 1 spin currency).
`

public class PopupData
{
    public string title;
    public string textureUrl;
}

public class ParticlesData
{
    public string textureUrl;
}

public class EventData
{
    public int id;
    public string action;
    public bool devOnly;

    public string name;

    public PopupData popupData;
    public SkinData skinData;
    public ParticlesData particlesData;
    public NotificationData notificationData;

    public int multiplier;
}
------------------
18/09
events:
todos los campos son optativos
reflejar el event data que está ahora
players:
agregar el ID
Jackpot:
deadline
Raffles:
el backend tiene que devolver los live
addManagement:
SlotMachine:
lose
ratio win/lose = 100
--------------------




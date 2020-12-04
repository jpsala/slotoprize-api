cuando el player llena un 


en el spin, cuando gana una carta cardData en el root devuelve los datos de la carta


enspoints:
  card-collections
  card-sets-completed
  card-trade

structures:

 public class CardCollectionsData
    {
        public List<CollectibleCardSetData> collectibleCardSets;
        public AtlasData atlasData;
        public CollectibleCardsTradeData tradeData;
    }


Set:

    public class CollectibleCardSetData
    {
        public string id;
        public string title;
        public string themeColor;
        public List<CollectibleCardData> cards;
        public string rewardType;
        public int rewardAmount;

        public int ownedQuantity;
    }


Carta:

    public class CollectibleCardData
    {
        public string id;
        public string title;
        public int stars;
        public string textureUrl;
        public int ownedQuantity;
    }



se reclama con album completo

- [x] que esta completo
- [x] que no se haya hecho el claimed anteriormente
- [x] si se cumplen rewardClaimed en true y otorgarle los rewards en la billetera

card_set_completed deviceId sessionToken setId

305109

endpoint card_trade params: regular: bool

- [x] que chest es de acuerdo a param regular
- [x recuento de estrellitas igual al de card collections chequeo que sean suficientes para comprar el chest selecionado
- [x] le otorgo la recompensa de ese chest
- [ ] falta sacar las cartas equiv a las estrellitas que gastó
- [ ] devuelvo:
collective card sets
trade data: cantidad actuliza del starsfortrade actualizada
"tradeData": {
    "starsForTrade": 0,
}


- [ ] en el BO definición de los cofres regular y premium


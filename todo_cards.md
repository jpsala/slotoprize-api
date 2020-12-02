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

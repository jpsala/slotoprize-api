$$
Daily Reward System
Open
$$

$$Daily Reward System$$

The producer will be able to input the following information in the backend:

Day (D1,D2, D3... without end limit)
Reward (at the moment only coins or tickets)
The client will show the corresponding icon upon the kind of reward of the day.
eg( 1~50 coins - 1 coin icon // 51~100 coins - 3 coins icon // any amount of
tickets - tickets icon // ...)

The daily reward strike is resetted if the player misses one day of connection.
He goes back to day 0, if he then connects again the day after that he will start
the daily reward from Day 1.

Designs
On game_init endpoint, we would add a list of rewards, with all the rewards defined
on the backend. Also, we will have an int value, defining how many consecutive days
the player has logged.
{
  "id": 1,
  "type": "coin",
  "amount": 10
}
public class InitData
{
    ...
    public int consecutiveDailyLogs;
    public List<RewardData> dailyRewardsData;
}

public class RewardData
{
    public string type;
    public int amount;
}








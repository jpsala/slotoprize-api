ws.send(JSON.stringify({
                code: 200,
                message: 'TestMessage',
                type: 'TestType',
                payload: {
                    "symbolsData": [
                        {
                            "paymentType": "jackpot",
                            "isPaying": false
                        },
                        {
                            "paymentType": "blueberry",
                            "isPaying": false
                        },
                        {
                            "paymentType": "cherry",
                            "isPaying": false
                        }
                    ],
                    "isWin": false,
                    "walletData": {
                        "coins": 3229,
                        "tickets": 130
                    }
                })
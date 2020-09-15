**EventData changes**

Event data will have some changes on data and structure.

The field "skin", should be renamed to "skinData".
Instead of "notificationMessage" and "notificationTextureUrl" we will now have a "notificationData" field in the format we already use for notifications.
New field named "particlesData", wich is an object (displayer below). On the backoffice, producer will be able to set a texture for the event particles.
Instead of "popupMessage" and "popupTextureUrl;" we will now have a "popupData" field (structure exposed below). On the backoffice, producer will be able to set a texture, title, and message for the popup.
Field "betPrice" should be removed (spins wont have a price anymore, each spin will consume 1 spin currency).
# Security Specification

## Data Invariants
1. `inventory`: An inventory item cannot exist without a valid userId. Users can only access their own inventory.
2. `shopping`: A shopping list item belongs exclusively to the user.
3. `recipes`: Custom recipes must belong to the user.
4. `meals` / `journey`: Meal logs (Food Journey) belong to the user.
5. All reads/writes must explicitly check `resource.data.userId == request.auth.uid`.

## Dirty Dozen Payloads
- T1: Missing required fields (e.g. no `name` in inventory).
- T2: Shadow update extra fields (e.g. `isAdmin: true`).
- T3: Updating `userId` to steal ownership.
- T4: Spoofed owner creation (creating for another `userId`).
- T5: Large payload attack (e.g. `name` > 200 chars).
- T6: Type violation (e.g. `quantity` as object instead of string).
- T7: List query without user bound.
- T8: Invalid ID variables (path poisoning).
...


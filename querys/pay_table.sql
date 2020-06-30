SELECT s.payment_type, pt.*, (SELECT SUM(pt1.probability) FROM pay_table pt1) total
FROM pay_table pt
 INNER JOIN symbol s ON pt.symbol_id = s.id
ORDER BY pt.probability asc
SELECT DATE_FORMAT(r.closing_date, '%Y/%m/%d') closing_data,
    r.raffle_number_price, r.texture_url, r.item_highlight
FROM raffle r
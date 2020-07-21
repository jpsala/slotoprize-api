import { deleteDataInTestDB, insertInPayTable, insertInSymbol } from "./initDB"
xdescribe('initDb', () => {
  it('deleteDataInTestDB', async () => {
    const deleteData = await deleteDataInTestDB()
    // console.log('initData', deleteData)
  for (const data of deleteData)
  expect(data.warningStatus).toBe(0)
  })
  it('insertInSymbol', async () => {
    const insertInSymbolData = await insertInSymbol()
    // console.log('initData', deleteData)
    for (const data of insertInSymbolData)
    expect(data.warningStatus).toBe(0)
  })
  it('insertInPayTable', async () => {
    const insertInPayTableData = await insertInPayTable()
    // console.log('initData', deleteData)
    for (const data of insertInPayTableData)
    expect(data.warningStatus).toBe(0)
  })
})
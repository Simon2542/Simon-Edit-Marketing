// In-memory storage for xiaowang-test notes
class XiaoWangTestNotesStore {
  private data: any[] = []
  private source: 'uploaded' | 'default' | null = null

  setData(data: any[]) {
    this.data = data
    this.source = 'uploaded'
  }

  getData() {
    return this.data
  }

  getSource() {
    return this.source
  }

  clear() {
    this.data = []
    this.source = null
  }
}

// Singleton instance
let storeInstance: XiaoWangTestNotesStore | null = null

export function getXiaoWangTestNotesStore() {
  if (!storeInstance) {
    storeInstance = new XiaoWangTestNotesStore()
  }
  return storeInstance
}
// In-memory storage for LifeCar notes data
// This approach works like XiaoWang data - no file system dependency

interface LifeCarNote {
  发布时间: string
  类型: string
  名称: string
  链接: string
}

class NotesStore {
  private data: LifeCarNote[] | null = null
  private uploadTime: Date | null = null

  setData(data: LifeCarNote[]) {
    this.data = data
    this.uploadTime = new Date()
  }

  getData(): LifeCarNote[] | null {
    return this.data
  }

  clearData() {
    this.data = null
    this.uploadTime = null
  }

  hasData(): boolean {
    return this.data !== null
  }

  getSource(): 'uploaded' | 'default' | null {
    if (this.data !== null) {
      return 'uploaded'
    }
    return null
  }
}

// Single instance for the application lifecycle
let store: NotesStore | null = null

export function getNotesStore(): NotesStore {
  if (!store) {
    store = new NotesStore()
  }
  return store
}
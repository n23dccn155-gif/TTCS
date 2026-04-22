const mockLowStock = [ 
]

const mockExpiry = [ 
]

const mockSlowMoving = [ 
]

const alertService = {
  getLowStock: async () => ({ data: mockLowStock }),
  getExpiry: async () => ({ data: mockExpiry }),
  getSlowMoving: async () => ({ data: mockSlowMoving }),
}

export default alertService
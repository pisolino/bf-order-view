const io = {};

const status = {
  running: false,
  subscribeInagoFlyer: false
}

const inagoData = {
  power: [],
  filled: false
};

const boardData = {
  mid_price: 0,
  bids: [],
  asks: []
};

const executions = {
  buy: [],
  sell: []
};

export const shared = {
  io,
  status,
  inagoData,
  boardData,
  executions
};

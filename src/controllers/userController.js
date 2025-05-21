import userService from '../services/userService.js';

// GET /api/users/me
export async function getMe(req, res, next) {
  try {
    const userId = req.user.id;
    const user = await userService.getUserById(userId);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/users/me
export async function updateMe(req, res, next) {
  try {
    const userId = req.user.id;
    const updated = await userService.updateUser(userId, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

// GET /api/users/me/cards
export async function getMyCards(req, res, next) {
  try {
    const userId = req.user.id;
    const cards = await userService.getCardsByUserId(userId);
    res.json(cards);
  } catch (err) {
    next(err);
  }
}

// GET /api/users/me/sales
export async function getMySales(req, res, next) {
  try {
    const userId = req.user.id;
    const sales = await userService.getSalesByUserId(userId);
    res.json(sales);
  } catch (err) {
    next(err);
  }
}

// GET /api/users/:nickname
export async function getUserByNickname(req, res, next) {
  try {
    const {nickname} = req.params;
    const user = await userService.getUserByNickname(nickname);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export default {
  getMe,
  updateMe,
  getMyCards,
  getMySales,
  getUserByNickname,
};

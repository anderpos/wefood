import { startOfDay, endOfDay, parseISO } from 'date-fns';
import { Op } from 'sequelize';

import Order from '../models/Order';
import User from '../models/User';

class ScheduleController {
  async index(req, res){
    const userIsProvider = await User.findOne({
      where: {id: req.userId, provider: true}
    });

    if (!userIsProvider) {
      return res.status(401).json({ error: 'You are not a provider' });
    }

    const { date } = req.query;
    const parsedDate = parseISO(date);


    const orders = await Order.findAll({
      where: {
        provider_id: req.userId,
        canceled_at: null,
        date : {
          // Maybe refactor this and try to convert the date only to day
          [Op.between]: [startOfDay(parsedDate), endOfDay(parsedDate)]
          }
        },
        order: ['date']
      });

    return res.json(orders);
  }
}

export default new ScheduleController();
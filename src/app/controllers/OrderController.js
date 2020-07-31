import Order from '../models/Order';
import File from '../models/File';
import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore, format } from 'date-fns';
import User from '../models/User';
import Notification from '../schemas/Notification';

class OrderController {

  async index(req, res) {
    const { page = 1 } = req.query;

    const orders = await Order.findAll({
      where: { user_id: req.userId, canceled_at: null },
      order: ['date'],
      limit:20,
      offset: (page - 1) * 20,
      attributes:['id', 'date'],
      include: [
        {
          model: User, as: 'provider',
          attributes: ['id', 'name'],
          include: [
            {
              model: File, as: 'avatar',
              attributes:['id', 'path', 'url']
            }
          ]
        }
      ]
    });

    return res.json(orders);
  }

  async store(req, res) {

    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Something is invalid!'} )
    }

    const { provider_id, date } = req.body;

    if (req.userId == provider_id) {
      return res.status(400).json({ error: "You can't create an order for yourself " })
    }

    //Check if the id is from a provider
    const isProvider = await User.findOne({
      where: { id: provider_id, provider:true }
    });

    if (!isProvider){
      return res.status(401).json({ error: 'Invalid provider ID!' });
    }

    // Get only the hour
    const StartHour = startOfHour(parseISO(date));

    if (isBefore(StartHour, new Date())) {
      return res.status(400).json({ error: 'Order date is in the past' })
    }

    // Check date available
    const checkAvailability = await Order.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: StartHour,
      }
    });

    if (checkAvailability) {
      return res.status(400).json({ error: 'The time you requested is not avaliable' })
    }

    // Create new order
    const order = await Order.create({
      user_id: req.userId,
      provider_id,
      date
    });

    // Notify new order creation
    const user = await User.findByPk(req.userId);
    const formatedDate = format(StartHour, "dd 'of' MMMM', at ' H:mm");

    await Notification.create({
      content: `You have a new order from ${user.name} scheduled for ${formatedDate}!`,
      user: provider_id
    })


    return res.json(order);
  }
}

export default new OrderController();
module.exports = {
  dialect: 'postgres',
  host: '192.168.0.192',
  username: 'postgres',
  password: 'docker',
  database: 'wefood',
  define: {
    timestamps:true,
    underscored: true,
    underscoredAll: true,
  }
};
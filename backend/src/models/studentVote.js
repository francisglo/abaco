// Modelo de voto estudiantil
export default (sequelize, DataTypes) => {
  const StudentVote = sequelize.define('StudentVote', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    proposalId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    value: { type: DataTypes.INTEGER, allowNull: false }, // 1 = a favor, -1 = en contra
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'student_votes',
    timestamps: false
  });
  return StudentVote;
};
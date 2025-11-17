const { Bus } = require('../models');

// @desc    Lấy danh sách tất cả xe
// @route   GET /api/buses
// @access  Private/Admin
const getAllBuses = async (req, res, next) => {
  try {
    const { LoaiXe } = req.query;
    
    const whereCondition = {};
    if (LoaiXe) {
      whereCondition.LoaiXe = LoaiXe;
    }

    const buses = await Bus.findAll({
      where: whereCondition,
      order: [['BienSoXe', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: buses.length,
      data: buses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy chi tiết một xe
// @route   GET /api/buses/:bienSoXe
// @access  Private/Admin
const getBusByPlate = async (req, res, next) => {
  try {
    const bus = await Bus.findByPk(req.params.bienSoXe);

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy xe'
      });
    }

    res.status(200).json({
      success: true,
      data: bus
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Thêm xe mới
// @route   POST /api/buses
// @access  Private/Admin
const createBus = async (req, res, next) => {
  try {
    const { BienSoXe, LoaiXe, SoLuongGhe, NamSanXuat } = req.body;

    // Kiểm tra biển số đã tồn tại
    const existing = await Bus.findByPk(BienSoXe);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Biển số xe đã tồn tại'
      });
    }

    const bus = await Bus.create({
      BienSoXe,
      LoaiXe,
      SoLuongGhe,
      NamSanXuat
    });

    res.status(201).json({
      success: true,
      message: 'Thêm xe thành công',
      data: bus
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật thông tin xe
// @route   PUT /api/buses/:bienSoXe
// @access  Private/Admin
const updateBus = async (req, res, next) => {
  try {
    const bus = await Bus.findByPk(req.params.bienSoXe);

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy xe'
      });
    }

    const { LoaiXe, SoLuongGhe, NamSanXuat } = req.body;

    await bus.update({
      LoaiXe: LoaiXe || bus.LoaiXe,
      SoLuongGhe: SoLuongGhe || bus.SoLuongGhe,
      NamSanXuat: NamSanXuat !== undefined ? NamSanXuat : bus.NamSanXuat
    });

    res.status(200).json({
      success: true,
      message: 'Cập nhật xe thành công',
      data: bus
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa xe
// @route   DELETE /api/buses/:bienSoXe
// @access  Private/Admin
const deleteBus = async (req, res, next) => {
  try {
    const bus = await Bus.findByPk(req.params.bienSoXe);

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy xe'
      });
    }

    await bus.destroy();

    res.status(200).json({
      success: true,
      message: 'Xóa xe thành công'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllBuses,
  getBusByPlate,
  createBus,
  updateBus,
  deleteBus
};
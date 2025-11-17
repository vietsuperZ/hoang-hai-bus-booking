const { Route, Location } = require('../models');

// @desc    Lấy danh sách tất cả tuyến đường
// @route   GET /api/routes
// @access  Public
const getAllRoutes = async (req, res, next) => {
  try {
    const routes = await Route.findAll({
      include: [
        {
          model: Location,
          as: 'diemDi',
          attributes: ['MaDiaDiem', 'TenDiaDiem', 'TenTinh']
        },
        {
          model: Location,
          as: 'diemDen',
          attributes: ['MaDiaDiem', 'TenDiaDiem', 'TenTinh']
        }
      ],
      order: [['MaTuyen', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: routes.length,
      data: routes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy chi tiết một tuyến đường
// @route   GET /api/routes/:id
// @access  Public
const getRouteById = async (req, res, next) => {
  try {
    const route = await Route.findByPk(req.params.id, {
      include: [
        {
          model: Location,
          as: 'diemDi',
          attributes: ['MaDiaDiem', 'TenDiaDiem', 'TenTinh']
        },
        {
          model: Location,
          as: 'diemDen',
          attributes: ['MaDiaDiem', 'TenDiaDiem', 'TenTinh']
        }
      ]
    });

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tuyến đường'
      });
    }

    res.status(200).json({
      success: true,
      data: route
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Tìm kiếm tuyến đường theo điểm đi và điểm đến
// @route   GET /api/routes/search?diemDi=1&diemDen=2
// @access  Public
const searchRoutes = async (req, res, next) => {
  try {
    const { diemDi, diemDen } = req.query;

    if (!diemDi || !diemDen) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn điểm đi và điểm đến'
      });
    }

    const routes = await Route.findAll({
      where: {
        DiemDi_ID: diemDi,
        DiemDen_ID: diemDen
      },
      include: [
        {
          model: Location,
          as: 'diemDi',
          attributes: ['MaDiaDiem', 'TenDiaDiem', 'TenTinh']
        },
        {
          model: Location,
          as: 'diemDen',
          attributes: ['MaDiaDiem', 'TenDiaDiem', 'TenTinh']
        }
      ]
    });

    res.status(200).json({
      success: true,
      count: routes.length,
      data: routes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Tạo tuyến đường mới
// @route   POST /api/routes
// @access  Private/Admin
const createRoute = async (req, res, next) => {
  try {
    const { DiemDi_ID, DiemDen_ID, KhoangCach, ThoiGianDuKien, GiaCoBan } = req.body;

    // Kiểm tra điểm đi và điểm đến có tồn tại không
    const diemDi = await Location.findByPk(DiemDi_ID);
    const diemDen = await Location.findByPk(DiemDen_ID);

    if (!diemDi || !diemDen) {
      return res.status(404).json({
        success: false,
        message: 'Điểm đi hoặc điểm đến không tồn tại'
      });
    }

    // Kiểm tra tuyến đã tồn tại chưa
    const existing = await Route.findOne({
      where: { DiemDi_ID, DiemDen_ID }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Tuyến đường đã tồn tại'
      });
    }

    const route = await Route.create({
      DiemDi_ID,
      DiemDen_ID,
      KhoangCach,
      ThoiGianDuKien,
      GiaCoBan
    });

    // Lấy lại route với thông tin đầy đủ
    const routeWithDetails = await Route.findByPk(route.MaTuyen, {
      include: [
        { model: Location, as: 'diemDi' },
        { model: Location, as: 'diemDen' }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Tạo tuyến đường thành công',
      data: routeWithDetails
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật tuyến đường
// @route   PUT /api/routes/:id
// @access  Private/Admin
const updateRoute = async (req, res, next) => {
  try {
    const route = await Route.findByPk(req.params.id);

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tuyến đường'
      });
    }

    const { KhoangCach, ThoiGianDuKien, GiaCoBan } = req.body;

    await route.update({
      KhoangCach: KhoangCach || route.KhoangCach,
      ThoiGianDuKien: ThoiGianDuKien || route.ThoiGianDuKien,
      GiaCoBan: GiaCoBan || route.GiaCoBan
    });

    // Lấy lại route với thông tin đầy đủ
    const routeWithDetails = await Route.findByPk(route.MaTuyen, {
      include: [
        { model: Location, as: 'diemDi' },
        { model: Location, as: 'diemDen' }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Cập nhật tuyến đường thành công',
      data: routeWithDetails
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa tuyến đường
// @route   DELETE /api/routes/:id
// @access  Private/Admin
const deleteRoute = async (req, res, next) => {
  try {
    const route = await Route.findByPk(req.params.id);

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tuyến đường'
      });
    }

    await route.destroy();

    res.status(200).json({
      success: true,
      message: 'Xóa tuyến đường thành công'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllRoutes,
  getRouteById,
  searchRoutes,
  createRoute,
  updateRoute,
  deleteRoute
};
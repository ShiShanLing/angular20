/**
 * 中国城市/区县本地坐标库
 * 用于补充 Open-Meteo geocoding 对中国地名覆盖不足的问题。
 * 支持中文名、拼音、别名匹配。
 * 如需扩展，直接往数组中追加即可。
 */
export interface ChinaCity {
  name: string;       // 标准名称（如"临泉县"）
  alias: string[];    // 别名/简称/拼音（如["临泉","linquan","lq"]）
  lat: number;
  lon: number;
  admin1: string;     // 省
  admin2: string;     // 市
}

export const CHINA_CITIES: ChinaCity[] = [
  // ===== 直辖市 =====
  { name: '北京市', alias: ['北京', 'beijing', 'bj'], lat: 39.9042, lon: 116.4074, admin1: '北京市', admin2: '北京市' },
  { name: '天津市', alias: ['天津', 'tianjin', 'tj'], lat: 39.0842, lon: 117.2010, admin1: '天津市', admin2: '天津市' },
  { name: '上海市', alias: ['上海', 'shanghai', 'sh'], lat: 31.2304, lon: 121.4737, admin1: '上海市', admin2: '上海市' },
  { name: '重庆市', alias: ['重庆', 'chongqing', 'cq'], lat: 29.5630, lon: 106.5516, admin1: '重庆市', admin2: '重庆市' },

  // ===== 省会/副省级城市 =====
  { name: '石家庄市', alias: ['石家庄', 'shijiazhuang'], lat: 38.0428, lon: 114.5149, admin1: '河北省', admin2: '石家庄市' },
  { name: '太原市', alias: ['太原', 'taiyuan'], lat: 37.8706, lon: 112.5489, admin1: '山西省', admin2: '太原市' },
  { name: '呼和浩特市', alias: ['呼和浩特', 'huhehaote', '呼市'], lat: 40.8422, lon: 111.7493, admin1: '内蒙古自治区', admin2: '呼和浩特市' },
  { name: '沈阳市', alias: ['沈阳', 'shenyang'], lat: 41.8057, lon: 123.4315, admin1: '辽宁省', admin2: '沈阳市' },
  { name: '长春市', alias: ['长春', 'changchun'], lat: 43.8171, lon: 125.3235, admin1: '吉林省', admin2: '长春市' },
  { name: '哈尔滨市', alias: ['哈尔滨', 'haerbin'], lat: 45.7568, lon: 126.6424, admin1: '黑龙江省', admin2: '哈尔滨市' },
  { name: '南京市', alias: ['南京', 'nanjing'], lat: 32.0603, lon: 118.7969, admin1: '江苏省', admin2: '南京市' },
  { name: '杭州市', alias: ['杭州', 'hangzhou'], lat: 30.2741, lon: 120.1551, admin1: '浙江省', admin2: '杭州市' },
  { name: '合肥市', alias: ['合肥', 'hefei'], lat: 31.8206, lon: 117.2272, admin1: '安徽省', admin2: '合肥市' },
  { name: '福州市', alias: ['福州', 'fuzhou'], lat: 26.0745, lon: 119.2965, admin1: '福建省', admin2: '福州市' },
  { name: '南昌市', alias: ['南昌', 'nanchang'], lat: 28.6830, lon: 115.8581, admin1: '江西省', admin2: '南昌市' },
  { name: '济南市', alias: ['济南', 'jinan'], lat: 36.6512, lon: 116.9967, admin1: '山东省', admin2: '济南市' },
  { name: '郑州市', alias: ['郑州', 'zhengzhou'], lat: 34.7466, lon: 113.6254, admin1: '河南省', admin2: '郑州市' },
  { name: '武汉市', alias: ['武汉', 'wuhan'], lat: 30.5928, lon: 114.3054, admin1: '湖北省', admin2: '武汉市' },
  { name: '长沙市', alias: ['长沙', 'changsha'], lat: 28.2282, lon: 112.9388, admin1: '湖南省', admin2: '长沙市' },
  { name: '广州市', alias: ['广州', 'guangzhou'], lat: 23.1291, lon: 113.2644, admin1: '广东省', admin2: '广州市' },
  { name: '南宁市', alias: ['南宁', 'nanning'], lat: 22.8170, lon: 108.3664, admin1: '广西壮族自治区', admin2: '南宁市' },
  { name: '海口市', alias: ['海口', 'haikou'], lat: 20.0174, lon: 110.3492, admin1: '海南省', admin2: '海口市' },
  { name: '成都市', alias: ['成都', 'chengdu'], lat: 30.5728, lon: 104.0668, admin1: '四川省', admin2: '成都市' },
  { name: '贵阳市', alias: ['贵阳', 'guiyang'], lat: 26.6470, lon: 106.6302, admin1: '贵州省', admin2: '贵阳市' },
  { name: '昆明市', alias: ['昆明', 'kunming'], lat: 25.0406, lon: 102.7125, admin1: '云南省', admin2: '昆明市' },
  { name: '拉萨市', alias: ['拉萨', 'lasa', 'lhasa'], lat: 29.6500, lon: 91.1000, admin1: '西藏自治区', admin2: '拉萨市' },
  { name: '西安市', alias: ['西安', 'xian'], lat: 34.2658, lon: 108.9541, admin1: '陕西省', admin2: '西安市' },
  { name: '兰州市', alias: ['兰州', 'lanzhou'], lat: 36.0611, lon: 103.8343, admin1: '甘肃省', admin2: '兰州市' },
  { name: '西宁市', alias: ['西宁', 'xining'], lat: 36.6171, lon: 101.7782, admin1: '青海省', admin2: '西宁市' },
  { name: '银川市', alias: ['银川', 'yinchuan'], lat: 38.4872, lon: 106.2309, admin1: '宁夏回族自治区', admin2: '银川市' },
  { name: '乌鲁木齐市', alias: ['乌鲁木齐', 'wulumuqi', 'urumqi'], lat: 43.8256, lon: 87.6168, admin1: '新疆维吾尔自治区', admin2: '乌鲁木齐市' },

  // ===== 重要地级市/经济城市 =====
  { name: '深圳市', alias: ['深圳', 'shenzhen', 'sz'], lat: 22.5431, lon: 114.0579, admin1: '广东省', admin2: '深圳市' },
  { name: '苏州市', alias: ['苏州', 'suzhou'], lat: 31.2990, lon: 120.5853, admin1: '江苏省', admin2: '苏州市' },
  { name: '东莞市', alias: ['东莞', 'dongguan'], lat: 23.0205, lon: 113.7518, admin1: '广东省', admin2: '东莞市' },
  { name: '佛山市', alias: ['佛山', 'foshan'], lat: 23.0218, lon: 113.1219, admin1: '广东省', admin2: '佛山市' },
  { name: '无锡市', alias: ['无锡', 'wuxi'], lat: 31.4912, lon: 120.3119, admin1: '江苏省', admin2: '无锡市' },
  { name: '宁波市', alias: ['宁波', 'ningbo'], lat: 29.8683, lon: 121.5440, admin1: '浙江省', admin2: '宁波市' },
  { name: '温州市', alias: ['温州', 'wenzhou'], lat: 27.9939, lon: 120.6993, admin1: '浙江省', admin2: '温州市' },
  { name: '青岛市', alias: ['青岛', 'qingdao'], lat: 36.0671, lon: 120.3826, admin1: '山东省', admin2: '青岛市' },
  { name: '烟台市', alias: ['烟台', 'yantai'], lat: 37.4638, lon: 121.4479, admin1: '山东省', admin2: '烟台市' },
  { name: '大连市', alias: ['大连', 'dalian'], lat: 38.9140, lon: 121.6147, admin1: '辽宁省', admin2: '大连市' },
  { name: '厦门市', alias: ['厦门', 'xiamen'], lat: 24.4798, lon: 118.0894, admin1: '福建省', admin2: '厦门市' },
  { name: '泉州市', alias: ['泉州', 'quanzhou'], lat: 24.8741, lon: 118.6757, admin1: '福建省', admin2: '泉州市' },
  { name: '珠海市', alias: ['珠海', 'zhuhai'], lat: 22.2710, lon: 113.5767, admin1: '广东省', admin2: '珠海市' },
  { name: '惠州市', alias: ['惠州', 'huizhou'], lat: 23.1116, lon: 114.4161, admin1: '广东省', admin2: '惠州市' },
  { name: '中山市', alias: ['中山', 'zhongshan'], lat: 22.5176, lon: 113.3929, admin1: '广东省', admin2: '中山市' },

  // ===== 安徽地级市 =====
  { name: '芜湖市', alias: ['芜湖', 'wuhu'], lat: 31.3525, lon: 118.4331, admin1: '安徽省', admin2: '芜湖市' },
  { name: '蚌埠市', alias: ['蚌埠', 'bengbu'], lat: 32.9166, lon: 117.3616, admin1: '安徽省', admin2: '蚌埠市' },
  { name: '淮南市', alias: ['淮南', 'huainan'], lat: 32.6261, lon: 116.9995, admin1: '安徽省', admin2: '淮南市' },
  { name: '马鞍山市', alias: ['马鞍山', 'maanshan'], lat: 31.6705, lon: 118.5070, admin1: '安徽省', admin2: '马鞍山市' },
  { name: '淮北市', alias: ['淮北', 'huaibei'], lat: 33.9556, lon: 116.7941, admin1: '安徽省', admin2: '淮北市' },
  { name: '铜陵市', alias: ['铜陵', 'tongling'], lat: 30.9450, lon: 117.8120, admin1: '安徽省', admin2: '铜陵市' },
  { name: '安庆市', alias: ['安庆', 'anqing'], lat: 30.5435, lon: 117.0632, admin1: '安徽省', admin2: '安庆市' },
  { name: '黄山市', alias: ['黄山', 'huangshan'], lat: 29.7144, lon: 118.3380, admin1: '安徽省', admin2: '黄山市' },
  { name: '阜阳市', alias: ['阜阳', 'fuyang'], lat: 32.8901, lon: 115.8141, admin1: '安徽省', admin2: '阜阳市' },
  { name: '宿州市', alias: ['宿州', 'suzhou2'], lat: 33.6468, lon: 116.9640, admin1: '安徽省', admin2: '宿州市' },
  { name: '滁州市', alias: ['滁州', 'chuzhou'], lat: 32.3014, lon: 118.3176, admin1: '安徽省', admin2: '滁州市' },
  { name: '六安市', alias: ['六安', 'luan'], lat: 31.7550, lon: 116.5200, admin1: '安徽省', admin2: '六安市' },
  { name: '宣城市', alias: ['宣城', 'xuancheng'], lat: 30.9456, lon: 118.7594, admin1: '安徽省', admin2: '宣城市' },
  { name: '池州市', alias: ['池州', 'chizhou'], lat: 30.6647, lon: 117.4919, admin1: '安徽省', admin2: '池州市' },
  { name: '亳州市', alias: ['亳州', 'bozhou'], lat: 33.8446, lon: 115.7786, admin1: '安徽省', admin2: '亳州市' },

  // ===== 安徽重点区县（Open-Meteo 缺失的） =====
  { name: '临泉县', alias: ['临泉', 'linquan'], lat: 33.0700, lon: 115.2000, admin1: '安徽省', admin2: '阜阳市' },
  { name: '太和县', alias: ['太和', 'taihe'], lat: 33.1600, lon: 115.6200, admin1: '安徽省', admin2: '阜阳市' },
  { name: '阜南县', alias: ['阜南', 'funan'], lat: 32.6400, lon: 115.5800, admin1: '安徽省', admin2: '阜阳市' },
  { name: '颍上县', alias: ['颍上', 'yingshang'], lat: 32.6400, lon: 116.2700, admin1: '安徽省', admin2: '阜阳市' },
  { name: '界首市', alias: ['界首', 'jieshou'], lat: 33.2600, lon: 115.3700, admin1: '安徽省', admin2: '阜阳市' },
  { name: '界首', alias: [], lat: 33.2600, lon: 115.3700, admin1: '安徽省', admin2: '阜阳市' },

  // ===== 河南地级市 =====
  { name: '洛阳市', alias: ['洛阳', 'luoyang'], lat: 34.6197, lon: 112.4540, admin1: '河南省', admin2: '洛阳市' },
  { name: '开封市', alias: ['开封', 'kaifeng'], lat: 34.7972, lon: 114.3415, admin1: '河南省', admin2: '开封市' },
  { name: '南阳市', alias: ['南阳', 'nanyang'], lat: 32.9908, lon: 112.5283, admin1: '河南省', admin2: '南阳市' },
  { name: '许昌市', alias: ['许昌', 'xuchang'], lat: 34.0357, lon: 113.8523, admin1: '河南省', admin2: '许昌市' },
  { name: '周口市', alias: ['周口', 'zhoukou'], lat: 33.6261, lon: 114.6978, admin1: '河南省', admin2: '周口市' },
  { name: '信阳市', alias: ['信阳', 'xinyang'], lat: 32.1264, lon: 114.0913, admin1: '河南省', admin2: '信阳市' },
  { name: '商丘市', alias: ['商丘', 'shangqiu'], lat: 34.4153, lon: 115.6502, admin1: '河南省', admin2: '商丘市' },
  { name: '驻马店市', alias: ['驻马店', 'zhumadian'], lat: 32.9801, lon: 114.0228, admin1: '河南省', admin2: '驻马店市' },

  // ===== 江苏地级市 =====
  { name: '常州市', alias: ['常州', 'changzhou'], lat: 31.8107, lon: 119.9741, admin1: '江苏省', admin2: '常州市' },
  { name: '南通市', alias: ['南通', 'nantong'], lat: 31.9800, lon: 120.8944, admin1: '江苏省', admin2: '南通市' },
  { name: '徐州市', alias: ['徐州', 'xuzhou'], lat: 34.2043, lon: 117.2858, admin1: '江苏省', admin2: '徐州市' },
  { name: '扬州市', alias: ['扬州', 'yangzhou'], lat: 32.3940, lon: 119.4129, admin1: '江苏省', admin2: '扬州市' },
  { name: '盐城市', alias: ['盐城', 'yancheng'], lat: 33.3477, lon: 120.1614, admin1: '江苏省', admin2: '盐城市' },
  { name: '连云港市', alias: ['连云港', 'lianyungang'], lat: 34.5965, lon: 119.2216, admin1: '江苏省', admin2: '连云港市' },

  // ===== 浙江地级市 =====
  { name: '嘉兴市', alias: ['嘉兴', 'jiaxing'], lat: 30.7453, lon: 120.7555, admin1: '浙江省', admin2: '嘉兴市' },
  { name: '湖州市', alias: ['湖州', 'huzhou'], lat: 30.8726, lon: 120.0938, admin1: '浙江省', admin2: '湖州市' },
  { name: '绍兴市', alias: ['绍兴', 'shaoxing'], lat: 30.0018, lon: 120.5721, admin1: '浙江省', admin2: '绍兴市' },
  { name: '金华市', alias: ['金华', 'jinhua'], lat: 29.0784, lon: 119.6494, admin1: '浙江省', admin2: '金华市' },
  { name: '台州市', alias: ['台州', 'taizhou'], lat: 28.6560, lon: 121.4207, admin1: '浙江省', admin2: '台州市' },

  // ===== 山东地级市 =====
  { name: '潍坊市', alias: ['潍坊', 'weifang'], lat: 36.7068, lon: 119.1619, admin1: '山东省', admin2: '潍坊市' },
  { name: '临沂市', alias: ['临沂', 'linyi'], lat: 35.1041, lon: 118.3563, admin1: '山东省', admin2: '临沂市' },
  { name: '淄博市', alias: ['淄博', 'zibo'], lat: 36.8131, lon: 118.0548, admin1: '山东省', admin2: '淄博市' },
  { name: '威海市', alias: ['威海', 'weihai'], lat: 37.5131, lon: 122.1200, admin1: '山东省', admin2: '威海市' },
  { name: '泰安市', alias: ['泰安', 'taian'], lat: 36.1950, lon: 117.0884, admin1: '山东省', admin2: '泰安市' },

  // ===== 广东地级市 =====
  { name: '汕头市', alias: ['汕头', 'shantou'], lat: 23.3535, lon: 116.6814, admin1: '广东省', admin2: '汕头市' },
  { name: '湛江市', alias: ['湛江', 'zhanjiang'], lat: 21.2707, lon: 110.3856, admin1: '广东省', admin2: '湛江市' },
  { name: '茂名市', alias: ['茂名', 'maoming'], lat: 21.6628, lon: 110.9255, admin1: '广东省', admin2: '茂名市' },
  { name: '肇庆市', alias: ['肇庆', 'zhaoqing'], lat: 23.0472, lon: 112.4653, admin1: '广东省', admin2: '肇庆市' },
  { name: '江门市', alias: ['江门', 'jiangmen'], lat: 22.5790, lon: 113.0819, admin1: '广东省', admin2: '江门市' },
  { name: '揭阳市', alias: ['揭阳', 'jieyang'], lat: 23.5500, lon: 116.3726, admin1: '广东省', admin2: '揭阳市' },
  { name: '潮州市', alias: ['潮州', 'chaozhou'], lat: 23.6568, lon: 116.6226, admin1: '广东省', admin2: '潮州市' },

  // ===== 湖南地级市 =====
  { name: '株洲市', alias: ['株洲', 'zhuzhou'], lat: 27.8274, lon: 113.1340, admin1: '湖南省', admin2: '株洲市' },
  { name: '湘潭市', alias: ['湘潭', 'xiangtan'], lat: 27.8291, lon: 112.9442, admin1: '湖南省', admin2: '湘潭市' },
  { name: '衡阳市', alias: ['衡阳', 'hengyang'], lat: 26.8930, lon: 112.5720, admin1: '湖南省', admin2: '衡阳市' },
  { name: '岳阳市', alias: ['岳阳', 'yueyang'], lat: 29.3571, lon: 113.1290, admin1: '湖南省', admin2: '岳阳市' },
  { name: '常德市', alias: ['常德', 'changde'], lat: 29.0317, lon: 111.6984, admin1: '湖南省', admin2: '常德市' },

  // ===== 湖北地级市 =====
  { name: '宜昌市', alias: ['宜昌', 'yichang'], lat: 30.6918, lon: 111.2868, admin1: '湖北省', admin2: '宜昌市' },
  { name: '襄阳市', alias: ['襄阳', 'xiangyang'], lat: 32.0102, lon: 112.1224, admin1: '湖北省', admin2: '襄阳市' },
  { name: '荆州市', alias: ['荆州', 'jingzhou'], lat: 30.3350, lon: 112.2390, admin1: '湖北省', admin2: '荆州市' },

  // ===== 四川地级市 =====
  { name: '绵阳市', alias: ['绵阳', 'mianyang'], lat: 31.4678, lon: 104.6795, admin1: '四川省', admin2: '绵阳市' },
  { name: '德阳市', alias: ['德阳', 'deyang'], lat: 31.1270, lon: 104.3977, admin1: '四川省', admin2: '德阳市' },
  { name: '宜宾市', alias: ['宜宾', 'yibin'], lat: 28.7518, lon: 104.6432, admin1: '四川省', admin2: '宜宾市' },
  { name: '泸州市', alias: ['泸州', 'luzhou'], lat: 28.8718, lon: 105.4424, admin1: '四川省', admin2: '泸州市' },
  { name: '南充市', alias: ['南充', 'nanchong'], lat: 30.8373, lon: 106.1107, admin1: '四川省', admin2: '南充市' },
  { name: '乐山市', alias: ['乐山', 'leshan'], lat: 29.5521, lon: 103.7661, admin1: '四川省', admin2: '乐山市' },

  // ===== 福建地级市 =====
  { name: '漳州市', alias: ['漳州', 'zhangzhou'], lat: 24.5127, lon: 117.6472, admin1: '福建省', admin2: '漳州市' },
  { name: '龙岩市', alias: ['龙岩', 'longyan'], lat: 25.0765, lon: 117.0175, admin1: '福建省', admin2: '龙岩市' },
  { name: '莆田市', alias: ['莆田', 'putian'], lat: 25.4541, lon: 119.0078, admin1: '福建省', admin2: '莆田市' },
  { name: '三明市', alias: ['三明', 'sanming'], lat: 26.2632, lon: 117.6387, admin1: '福建省', admin2: '三明市' },

  // ===== 其他重要城市 =====
  { name: '三亚市', alias: ['三亚', 'sanya'], lat: 18.2528, lon: 109.5120, admin1: '海南省', admin2: '三亚市' },
  { name: '桂林市', alias: ['桂林', 'guilin'], lat: 25.2742, lon: 110.2990, admin1: '广西壮族自治区', admin2: '桂林市' },
  { name: '丽江市', alias: ['丽江', 'lijiang'], lat: 26.8721, lon: 100.2250, admin1: '云南省', admin2: '丽江市' },
  { name: '大理市', alias: ['大理', 'dali'], lat: 25.6065, lon: 100.2676, admin1: '云南省', admin2: '大理白族自治州' },
  { name: '敦煌市', alias: ['敦煌', 'dunhuang'], lat: 40.1421, lon: 94.6619, admin1: '甘肃省', admin2: '酒泉市' },
  { name: '张家界市', alias: ['张家界', 'zhangjiajie'], lat: 29.1170, lon: 110.4792, admin1: '湖南省', admin2: '张家界市' },
  { name: '秦皇岛市', alias: ['秦皇岛', 'qinhuangdao'], lat: 39.9354, lon: 119.6005, admin1: '河北省', admin2: '秦皇岛市' },
  { name: '遵义市', alias: ['遵义', 'zunyi'], lat: 27.7256, lon: 106.9271, admin1: '贵州省', admin2: '遵义市' },
  { name: '延安市', alias: ['延安', 'yanan'], lat: 36.5853, lon: 109.4898, admin1: '陕西省', admin2: '延安市' },

  // ===== 港澳台 =====
  { name: '香港', alias: ['香港', 'hongkong', 'hk', 'xianggang'], lat: 22.3193, lon: 114.1694, admin1: '香港特别行政区', admin2: '香港' },
  { name: '澳门', alias: ['澳门', 'macau', 'aomen'], lat: 22.1987, lon: 113.5439, admin1: '澳门特别行政区', admin2: '澳门' },
  { name: '台北市', alias: ['台北', 'taibei', 'taipei'], lat: 25.0330, lon: 121.5654, admin1: '台湾省', admin2: '台北市' },
  { name: '高雄市', alias: ['高雄', 'gaoxiong', 'kaohsiung'], lat: 22.6273, lon: 120.3014, admin1: '台湾省', admin2: '高雄市' },
];

/**
 * 在本地库中搜索城市
 * 支持精确匹配和模糊匹配（alias）
 */
export function searchLocalCity(query: string): ChinaCity[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: ChinaCity[] = [];
  const seen = new Set<string>();

  // 精确匹配 name
  for (const city of CHINA_CITIES) {
    if (city.name === query || city.name === query + '市' || city.name === query + '县' || city.name === query + '区') {
      if (!seen.has(city.name)) {
        results.push(city);
        seen.add(city.name);
      }
    }
  }

  // alias 匹配
  for (const city of CHINA_CITIES) {
    if (seen.has(city.name)) continue;
    for (const a of city.alias) {
      if (a.toLowerCase() === q) {
        results.push(city);
        seen.add(city.name);
        break;
      }
    }
  }

  // 前缀匹配 alias
  for (const city of CHINA_CITIES) {
    if (seen.has(city.name)) continue;
    for (const a of city.alias) {
      if (a.toLowerCase().startsWith(q) || a.toLowerCase().includes(q)) {
        results.push(city);
        seen.add(city.name);
        break;
      }
    }
  }

  return results;
}

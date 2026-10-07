'use client';
import React, { FC } from 'react';
import {
	BsBuildingsFill,
	BsCalendar2Date,
	BsCardChecklist,
	BsCart3,
	BsCollectionFill,
	BsEnvelopeAt,
	BsFillUnlockFill,
	BsShop,
	BsTextareaT,
	BsThreeDots,
	BsThreeDotsVertical,
} from 'react-icons/bs';
// import { useColorModeValue } from '@chakra-ui/react';
import { TbArrowForward, TbDownload, TbSettings, TbSelector } from 'react-icons/tb';
import {
	LuAlignEndVertical,
	LuAlignHorizontalJustifyCenter,
	LuAlignHorizontalJustifyEnd,
	LuAlignHorizontalJustifyStart,
	LuAlignHorizontalSpaceAround,
	LuAlignStartVertical,
	LuAlignVerticalJustifyCenter,
	LuImagePlus,
	LuSettings2,
	LuSlidersHorizontal,
	LuPalette,
} from 'react-icons/lu';
import { DiNpm } from 'react-icons/di';

import {
	TbFileInvoice,
	TbTruckDelivery,
	TbBrandPatreonFilled,
	TbFileExport,
	TbRefresh,
} from 'react-icons/tb';
import {
	FaTruck,
	FaTshirt,
	FaDesktop,
	FaCheckCircle,
	FaPenAlt,
	FaRegEnvelope,
	FaUserFriends,
	FaUserTag,
	FaMapMarkerAlt,
	FaGitSquare,
	FaFacebookSquare,
	FaRegUser,
} from 'react-icons/fa';

import {
	RiSettings3Fill,
	RiDiscountPercentFill,
	RiDeleteBinLine,
	RiEditLine,
} from 'react-icons/ri';
import { TiPrinter } from 'react-icons/ti';
import {
	IoMdBarcode,
	IoIosArrowBack,
	IoMdAddCircleOutline,
	IoIosHome,
	IoIosAddCircleOutline,
	IoIosStar,
	IoIosOptions,
} from 'react-icons/io';
import {
	CiMenuBurger,
	CiStar,
	CiTextAlignCenter,
	CiTextAlignJustify,
	CiTextAlignLeft,
	CiTextAlignRight,
	CiUser,
} from 'react-icons/ci';
import { GrSubtract, GrEdit, GrStatusUnknown } from 'react-icons/gr';
import { SiCkeditor4, SiGoogleanalytics } from 'react-icons/si';

import { FcFeedback } from 'react-icons/fc';
import {
	MdOutlineCancel,
	MdOutlineEdit,
	MdDelete,
	MdFeedback,
	MdFastfood,
	MdLocalPhone,
	MdInventory,
	MdSpaceDashboard,
	MdBrandingWatermark,
	MdEmail,
	MdAlignHorizontalCenter,
	MdAlignHorizontalLeft,
	MdAlignHorizontalRight,
} from 'react-icons/md';
import { HiOutlineDocumentDuplicate, HiOutlineFilter, HiUserGroup } from 'react-icons/hi';
// import { IoMdBarcode } from 'react-icons/io';

import {
	IoStorefront,
	IoEye,
	IoEyeOff,
	IoAdd,
	IoBagOutline,
	IoGridOutline,
	IoSearchOutline,
	IoLogOutOutline,
} from 'react-icons/io5';

import {
	FaUnlockKeyhole,
	FaTable,
	FaRegClock,
	FaPeopleGroup,
	FaFileInvoiceDollar,
	FaCircleInfo,
	FaRegCopy,
	FaCartShopping,
	FaMoneyCheckDollar,
	FaAddressCard,
	FaFileLines,
	FaIdCardClip,
	FaFileCode,
	FaFolder,
} from 'react-icons/fa6';
import { GoListUnordered, GoHomeFill, GoArrowUpRight } from 'react-icons/go';
import {
	HiMiniRocketLaunch,
	HiMiniDevicePhoneMobile,
	HiArrowUturnLeft,
	HiArrowUturnRight,
	HiViewColumns,
} from 'react-icons/hi2';

import {
	GiMoneyStack,
	GiClick,
	GiBuyCard,
	GiBrokenPottery,
	GiReturnArrow,
	GiDiscussion,
	GiAutoRepair,
} from 'react-icons/gi';
import { PiUserListFill, PiArticleMediumFill, PiEyeLight, PiSidebarFill } from 'react-icons/pi';
import { AiOutlineDelete, AiOutlineThunderbolt } from 'react-icons/ai';

import {
	BiSolidCategory,
	BiSortAZ,
	BiSolidBookContent,
	BiSolidReport,
	BiTransferAlt,
} from 'react-icons/bi';

import { RxSpaceBetweenHorizontally, RxSpaceEvenlyHorizontally } from 'react-icons/rx';
import iconOptionsArrayData from './iconOptionsArrayData';
import iconColor from './iconColor';
import { FiEdit, FiFilter, FiImage, FiUser } from 'react-icons/fi';
import { TfiLayoutSidebarRight } from 'react-icons/tfi';

export type IconNameOptions = (typeof iconOptionsArrayData)[number];

type IconProps = {
	size?: number;
	color?: string;
	name: IconNameOptions;
};

const icons: any = {
	// dashboard: MdSpaceDashboard,
	// role: BsFillUnlockFill,
	purchase: BsCart3,
	mainteinance: GiAutoRepair,
	project: FaFileCode,
	repo: FaGitSquare,
	email: BsEnvelopeAt,
	facebook: FaFacebookSquare,
	document: FaFileLines,
	employee: FaIdCardClip,
	meeting: GiDiscussion,
	npm: DiNpm,
	invoice: FaFileInvoiceDollar,
	author: FaPenAlt,
	blog: PiArticleMediumFill,
	logout: IoLogOutOutline,
	views: SiGoogleanalytics,
	analytics: SiGoogleanalytics,
	filter: FiFilter,
	'action-menu': GoListUnordered,
	clicks: GiClick,
	add: IoAdd,
	'add-circle': IoMdAddCircleOutline,
	'add-image': LuImagePlus,
	'add-tag': IoIosAddCircleOutline,
	arrow: TbArrowForward,
	'arrow-left': IoIosArrowBack,
	barcode: IoMdBarcode,
	brand: MdBrandingWatermark,
	'brand-alt': TbBrandPatreonFilled,
	cart: FaCartShopping,
	category: BiSolidCategory,
	check: FaCheckCircle,
	close: MdOutlineCancel,
	clock: FaRegClock,
	'clock-outline': FaRegClock,
	collections: BsCollectionFill,
	column: HiViewColumns,
	content: BiSolidBookContent,
	copy: FaRegCopy,
	customer: FaUserTag,
	customers: HiUserGroup,
	damage: GiBrokenPottery,
	dashboard: MdSpaceDashboard,
	date: BsCalendar2Date,
	delete: MdDelete,
	'view-outline': PiEyeLight,
	'arrow-angle': GoArrowUpRight,
	'delete-outline': AiOutlineDelete,
	'delete-builder': RiDeleteBinLine,
	delivery: TbTruckDelivery,
	'delivery-fill': FaTruck,
	deploy: HiMiniRocketLaunch,
	desktop: FaDesktop,
	discount: RiDiscountPercentFill,
	dots: BsThreeDots,
	'vertical-dots': BsThreeDotsVertical,
	download: TbDownload,
	edit: MdOutlineEdit,
	'edit-outline': FiEdit,
	'edit-builder': GrEdit,
	envelope: FaRegEnvelope,
	expense: FaMoneyCheckDollar,
	'export-doc': TbFileExport,
	eye: IoEye,
	'eye-off': IoEyeOff,
	feedback: FcFeedback,
	feedbacks: MdFeedback,
	fields: FaTable,
	preferences: LuSlidersHorizontal,
	home: GoHomeFill,
	info: FaCircleInfo,
	inventory: MdInventory,
	items: MdFastfood,
	leave: SiCkeditor4,
	location: BsBuildingsFill,
	map: FaMapMarkerAlt,
	menu: CiMenuBurger,
	mobile: HiMiniDevicePhoneMobile,
	order: TbFileInvoice,
	payment: GiMoneyStack,
	pos: TiPrinter,
	phone: MdLocalPhone,
	product: FaTshirt,
	// purchase: GiBuyCard,

	rating: IoIosStar,
	'rating-fill': IoIosStar,
	'rating-outline': CiStar,
	redo: HiArrowUturnRight,
	issue: BsCardChecklist,
	'update-key': RiEditLine,
	'user-outline': FiUser,
	duplicate: HiOutlineDocumentDuplicate,
	report: BiSolidReport,
	return: GiReturnArrow,
	role: FaUnlockKeyhole,
	search: IoSearchOutline,
	select: TbSelector,
	settings: TbSettings,
	options: IoIosOptions,
	'settings-fill': RiSettings3Fill,
	config: LuSettings2,
	palette: LuPalette,
	sidebaritems: PiSidebarFill,
	sidebarcategories: TfiLayoutSidebarRight,
	shop: BsShop,
	staff: FaPeopleGroup,
	store: IoStorefront,
	subtract: GrSubtract,
	supplier: PiUserListFill,
	thunder: AiOutlineThunderbolt,
	transfer: BiTransferAlt,
	undo: HiArrowUturnLeft,
	user: FaUserFriends,
	sort: BiSortAZ,

	refresh: TbRefresh,

	//zhoei icons
	'z-cart': IoBagOutline,
	'z-grid': IoGridOutline,

	//alignment
	'align-left': MdAlignHorizontalLeft,
	'align-center': MdAlignHorizontalCenter,
	'align-right': MdAlignHorizontalRight,

	//justify
	'justify-start': LuAlignHorizontalJustifyStart,
	'justify-end': LuAlignHorizontalJustifyEnd,
	'justify-center': LuAlignHorizontalJustifyCenter,
	'justify-space-between': RxSpaceBetweenHorizontally,
	'justify-space-around': LuAlignHorizontalSpaceAround,
	'justify-space-evenly': RxSpaceEvenlyHorizontally,

	//flex align
	'flex-start': LuAlignStartVertical,
	'flex-end': LuAlignEndVertical,
	'flex-center': LuAlignVerticalJustifyCenter,

	//text align
	'text-align-left': CiTextAlignLeft,
	'text-align-right': CiTextAlignRight,
	'text-align-center': CiTextAlignCenter,
	'text-align-justify': CiTextAlignJustify,

	folder: FaFolder,
	files: FiImage,
};

const Icon: FC<IconProps> = ({ name, ...props }) => {
	const IconComponent = icons[name] || GrStatusUnknown;
	// const brandColor = useColorModeValue('brand.light', 'brand.dark');
	// const defaultColor = useColorModeValue('#4a4a4a', 'white');
	// react-icons writes `color` into the svg's style, so a token has to be its
	// CSS variable to apply; with none the icon takes the text colour around it.
	const { color, ...rest } = props as any;
	return (
		<IconComponent
			{...rest}
			size={props.size}
			color={iconColor(name == 'arrow' ? 'accent.fg' : color) || 'currentColor'}
		/>
	);
};

export default Icon;

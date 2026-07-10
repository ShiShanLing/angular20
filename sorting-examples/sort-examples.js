/**
 * 排序算法示例
 *
 * 运行方式：
 *   node sorting-examples/sort-examples.js
 *
 * 说明：
 * - 下面每个排序函数都会先复制原数组，不直接修改传入的数组。
 * - 这样同一组测试数据可以反复给不同算法使用。
 */

const { default: te } = require("@angular/common/locales/te");



const sampleNumbers = [64, 25, 12, 22, 11, 90, 34];
//然后看一遍iOS. 最后看一遍angular
/**
 * 1. 冒泡排序 Bubble Sort
 * 
 * 思路：
 * - 相邻两个数两两比较。
 * - 如果前一个数比后一个数大，就交换它们。
 * - 一轮比较结束后，最大的数会像气泡一样“冒”到数组末尾。
 * - 重复这个过程，直到整个数组有序。
 * 
 */
// MARK: 冒泡2
function bubbleSort2(numbers) {
  const arr = [...numbers];
  
  //冒泡排序
  return arr;
}


function bubbleSort(numbers) {
  const arr = [...numbers];
  
  // 外层循环控制“比较几轮”。
  // arr.length - 1 是因为 n 个数字最多只需要排 n - 1 轮。

  for (let i = 0; i < arr.length - 1; i++) {
    // 如果某一轮没有发生交换，说明数组已经有序，可以提前结束。
    let swapped = false;

    // 内层循环负责相邻元素比较。
    // 每完成一轮，末尾都会多一个已经排好的最大值，所以要减去 i。
    for (let j = 0; j < arr.length - 1 - i; j++) {
      // 如果左边比右边大，就交换位置。
      if (arr[j] > arr[j + 1]) {
        const temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
        swapped = true;
      }
    }

    if (!swapped) {
      break;
    }
  }

  return arr;
}
// MARK: 选择2
//每次循环都找到一个最小的放到最前面.
function selectionSort2(numbers) {
  const arr = [...numbers];

  

  return arr;
}

/**
 * 2. 选择排序 Selection Sort
 * 思路：
 * - 每一轮从未排序区域里找出最小值。
 * - 把这个最小值放到当前轮次的起始位置。
 * - 例如第一轮找全数组最小值，放到第 0 位。
 * - 第二轮从第 1 位开始找最小值，放到第 1 位。
 */
function selectionSort(numbers) {
  const arr = [...numbers];

  // i 表示当前要放置“最小值”的位置。
  for (let i = 0; i < arr.length - 1; i++) {
    // 假设当前位置 i 就是最小值的位置。
    let minIndex = i;

    // 从 i 后面继续寻找真正的最小值。
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[j] < arr[minIndex]) {
        minIndex = j;
      }
    }
    
    // 如果找到的最小值不在当前位置，就交换。
    if (minIndex !== i) {
      const temp = arr[i];
      arr[i] = arr[minIndex];
      arr[minIndex] = temp;
    }
  }
  

  return arr;
}

//MARK: 插入2
function insertionSort2(numbers) {
  const arr = [...numbers];

  return arr;
}
//插入排序是默认 0 下标是最小的,然后拿着后面一个一个作对比如果找到比他小的就交换位置
/**
 * 3. 插入排序 Insertion Sort
 * 你以为的价值投资
 * 思路：
 * - 把数组分成“已排序区域”和“未排序区域”。
 * - 默认第一个元素已经是有序的。
 * - 每次从未排序区域拿一个元素，插入到已排序区域的正确位置。
 * - 很像整理扑克牌：拿到一张新牌，插入到手里合适的位置。
 */
function insertionSort(numbers) {
  const arr = [...numbers];
  //
  // 从第 1 个位置开始，因为第 0 个元素可以看作已经排好。
  for (let i = 1; i < arr.length; i++) {
    // current 是当前要插入到前面有序区域的数字。
    const current = arr[i];
    let j = i - 1;
    // 如果前面的数字比 current 大，就向右移动一格。
    // 这样可以给 current 腾出插入位置。
    while (j >= 0 && arr[j] > current) {
      arr[j + 1] = arr[j];
      j--;
    }
    
    // 循环结束后，j + 1 就是 current 应该放的位置。
    arr[j + 1] = current;
  }

  return arr;
}
// MARK: 快速2
function quickSort2(numbers) {
  const arr = [...numbers];

  
  return arr
}

/**
 * 4. 快速排序 Quick Sort
 * 思路:
 * - 选择一个基准值 pivot。
 * - 把比 pivot 小的数字放左边，比 pivot 大或相等的数字放右边。
 * - 然后分别对左边和右边继续做快速排序。
 * - 最后拼接：左边有序数组 + pivot + 右边有序数组。
 */
function quickSort(numbers) {
  const arr = [...numbers];
  
  //快速排序
  // 递归出口：数组长度为 0 或 1 时，本身就是有序的。
  if (arr.length <= 1) {
    return arr;
  }

  // 这里选择数组中间的元素作为基准值。
  const pivotIndex = Math.floor(arr.length / 2);
  const pivot = arr[pivotIndex];
  const left = [];
  const right = [];

  for (let i = 0; i < arr.length; i++) {
    // 跳过 pivot 自己，避免重复加入。
    if (i === pivotIndex) {
      continue;
    }
    /*
       
     */
    if (arr[i] < pivot) {
      left.push(arr[i]);
    } else {
      right.push(arr[i]);
    }
  }

  return [...quickSort(left), pivot, ...quickSort(right)];
}

// MARK: 并归2
function mergeSort2(numbers) {
  const arr = [...numbers];

  
  return [];
}

function merge2(left, right) {

}
//
/**
 * 5. 归并排序 Merge Sort
 * 
 * 思路：
 * - 先把数组不断从中间拆开，直到每个小数组只剩 1 个元素。
 * - 1 个元素的数组一定是有序的。
 * - 然后把两个有序数组合并成一个更大的有序数组。
 * - 不断合并，直到得到完整有序数组。
 */
function mergeSort(numbers) {
  const arr = [...numbers];

  if (arr.length <= 1) {
    return arr;
  }
  
  const middle = Math.floor(arr.length / 2);
  const left = arr.slice(0, middle);
  const right = arr.slice(middle);

  return merge(mergeSort(left), mergeSort(right));
}

/**
 * 合并两个已经有序的数组。
 */
function merge(left, right) {
  const result = [];
  let leftIndex = 0;
  let rightIndex = 0;

  // 两边都有数字时，每次取较小的那个放进结果数组。
  while (leftIndex < left.length && rightIndex < right.length) {
    if (left[leftIndex] <= right[rightIndex]) {
      result.push(left[leftIndex]);
      leftIndex++;
    } else {
      result.push(right[rightIndex]);
      rightIndex++;
    }
  }
  // 如果左边或右边还有剩余数字，直接追加到结果后面。
  return [...result, ...left.slice(leftIndex), ...right.slice(rightIndex)];
}

/**
 * 6. 堆排序 Heap Sort
 *  
 * 思路：
 * - 先把数组调整成“大顶堆”。
 * - 大顶堆的特点：父节点总是大于或等于子节点，所以堆顶是最大值。
 * - 把堆顶最大值交换到数组末尾。
 * - 剩下的区域继续调整成大顶堆，再把最大值放到末尾。
 * - 重复这个过程，数组就会从小到大排列。
 */

function heapSort(numbers) {
  const arr = [...numbers];
  const length = arr.length;
  
  // 第一步：从最后一个非叶子节点开始，构建大顶堆。
  // Math.floor(length / 2) - 1 是最后一个有子节点的父节点位置。
  for (let i = Math.floor(length / 2) - 1; i >= 0; i--) {
    heapify(arr, length, i);
  }
  
  // 第二步：不断把堆顶最大值放到数组末尾。
  for (let end = length - 1; end > 0; end--) {
    const temp = arr[0];
    arr[0] = arr[end];
    arr[end] = temp;
    
    // 交换后，末尾已经有序。
    // 只需要对剩下的 0 到 end - 1 区域重新调整为大顶堆。
    heapify(arr, end, 0);
  }
  
  return arr;
}
/*

*/
/**
 * 把以 rootIndex 为根节点的子树调整成大顶堆。
 * 
 * 参数：
 * - arr：要调整的数组。
 * - heapSize：当前堆的有效长度，超过这个范围的元素已经排好序。
 * - rootIndex：当前要检查的父节点位置。
 */
function heapify(arr, heapSize, rootIndex) {
  let largest = rootIndex;
  const leftChild = rootIndex * 2 + 1;
  const rightChild = rootIndex * 2 + 2;

  // 如果左子节点存在，并且比当前最大值还大，就更新 largest。
  if (leftChild < heapSize && arr[leftChild] > arr[largest]) {
    largest = leftChild;
  }
  
  // 如果右子节点存在，并且比当前最大值还大，也更新 largest。
  if (rightChild < heapSize && arr[rightChild] > arr[largest]) {
    largest = rightChild;
  }
  
  // 如果最大值不是父节点，说明父节点需要和更大的子节点交换。
  if (largest !== rootIndex) {
    const temp = arr[rootIndex];
    arr[rootIndex] = arr[largest];
    arr[largest] = temp;

    // 交换后，被换下去的数字可能还不满足大顶堆规则，所以继续向下调整。
    heapify(arr, heapSize, largest);
  }
}

function heapifyw(arr, heapSize, rootIndex) {
  
}

function runExamples() {
  console.log('原始数组：', sampleNumbers);
  console.log("冒泡排序：", bubbleSort2(sampleNumbers));
  console.log("选择排序：", selectionSort2(sampleNumbers));
  console.log("插入排序：", insertionSort2(sampleNumbers));
  console.log("快速排序：", quickSort2(sampleNumbers));
  console.log('归并排序：', mergeSort2(sampleNumbers)); //
  // console.log("堆排序：  ", heapSort(sampleNumbers));
}

runExamples();
